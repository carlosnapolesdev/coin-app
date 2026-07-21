import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { UI_ICONS } from './icons'

const SRC = join(__dirname, '..')

function vueFiles(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: 'utf-8' })
    .filter((p) => p.endsWith('.vue'))
    .map((p) => join(SRC, p))
}

// Static icon literals a template can render through the Material Symbols font.
function iconsInVue(source: string): string[] {
  const found = new Set<string>()
  // 1. `<span class="material-symbols-outlined ...">icon_name</span>`
  for (const m of source.matchAll(/material-symbols-outlined[\s\S]*?>\s*([a-z_]+)\s*</g)) {
    found.add(m[1])
  }
  // 2. Quoted literals in the *result branches* of a Material Symbols mustache,
  //    not in the comparison expression:
  //    `<span class="material-symbols-outlined">{{ cond ? 'a' : 'b' }}</span>`
  //    Skips strings before the first `?` (e.g. `'success'` in
  //    `item.type === 'success' ? 'check_circle' : 'error'`).
  for (const span of source.matchAll(/material-symbols-outlined[\s\S]*?>\s*\{\{([\s\S]*?)\}\}\s*</g)) {
    const branches = span[1].split('?').slice(1).join('?')
    for (const lit of branches.matchAll(/'([a-z_]+)'/g)) found.add(lit[1])
  }
  // 3. `icon="name"` / `trailingIcon="name"` props on icon-bearing components.
  for (const m of source.matchAll(/\b(?:icon|trailingIcon)="([a-z_]+)"/g)) {
    found.add(m[1])
  }
  return [...found]
}

// The navigation registry holds icon names as data, not in a template.
function iconsInNav(): string[] {
  const source = readFileSync(join(SRC, 'navigation/navItems.ts'), 'utf-8')
  return [...source.matchAll(/icon:\s*'([a-z_]+)'/g)].map((m) => m[1])
}

describe('UI_ICONS registry', () => {
  it('covers every static icon literal used across templates and navigation', () => {
    const declared = new Set<string>(UI_ICONS)
    const used = new Set<string>(iconsInNav())
    for (const file of vueFiles()) {
      for (const name of iconsInVue(readFileSync(file, 'utf-8'))) used.add(name)
    }
    const missing = [...used].filter((name) => !declared.has(name)).sort()
    expect(missing, `Icons used but not in UI_ICONS: ${missing.join(', ')}`).toEqual([])
  })

  it('has no duplicates', () => {
    expect(new Set(UI_ICONS).size).toBe(UI_ICONS.length)
  })
})