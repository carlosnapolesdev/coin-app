import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = () => readFileSync(join(__dirname, 'RegisterStepper.vue'), 'utf-8')

describe('RegisterStepper', () => {
  it('defines the responsive horizontal progress contract', () => {
    const content = source()

    expect(content).toMatch(/steps:\s*Step\[\]/)
    expect(content).toMatch(/currentStep:\s*number/)
    expect(content).toMatch(/currentLabel:\s*string/)
    expect(content).toMatch(/currentStep\s*>\s*step\.n\s*\?\s*['"]check['"]\s*:\s*step\.icon/)
    expect(content).toContain('lg:hidden')
    expect(content).toContain('lg:block')
  })
})
