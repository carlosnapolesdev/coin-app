import top from './TopHeader.vue?raw'
import { describe, expect, it } from 'vitest'

describe('TopHeader contract', () => {
  it('exposes a named "actions" slot for page-specific buttons', () => {
    expect(top).toContain('<slot name="actions"')
  })

  it('no longer renders the dead help button', () => {
    expect(top).not.toContain('topHeader.help')
  })
})