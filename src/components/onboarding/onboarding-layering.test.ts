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

  it('keeps the transaction coach mark anchored below the add button', () => {
    expect(transactionsView).toContain('coach-key="transactions" :text="t(\'onboarding.coach.transactions\')" placement="bottom"')
  })

  it('keeps the sticky page header above the coach mark popovers', () => {
    expect(pageHeader).toContain("sticky ? 'sticky top-0 z-30' : ''")
  })
})
