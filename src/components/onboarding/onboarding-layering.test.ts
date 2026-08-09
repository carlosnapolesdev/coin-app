import transactionsView from '../dashboard/TransactionsView.vue?raw'
import pageHeader from '../ui/PageHeader.vue?raw'
import coachMark from './CoachMark.vue?raw'
import { describe, expect, it } from 'vitest'

describe('onboarding layering contracts', () => {
  it('keeps coach mark popovers below the sticky page header', () => {
    expect(coachMark).toMatch(/class="[^"]*\bz-20\b[^"]*"/)
  })

  it('elevates the transaction filters above the transaction table', () => {
    expect(transactionsView).toContain('class="surface-card relative z-10 mb-6 flex flex-col gap-4 p-4"')
  })

  it('anchors the transaction coach mark to the header add button, right-aligned', () => {
    expect(pageHeader).toContain('coach-key="transactions"')
    // The trigger sits at the right edge of the viewport: a left-anchored
    // popover would hang off screen on a phone.
    expect(pageHeader).toContain('align="right"')
  })

  it('leaves no second add-transaction trigger in the transactions toolbar', () => {
    expect(transactionsView).not.toContain('coach-key="transactions"')
  })

  it('keeps the sticky page header above the coach mark popovers', () => {
    expect(pageHeader).toContain("sticky ? 'sticky top-0 z-30' : ''")
  })
})
