import pageHeader from './PageHeader.vue?raw'
import transactionsView from '../dashboard/TransactionsView.vue?raw'
import quickTransactionHost from '../dashboard/QuickTransactionHost.vue?raw'
import { describe, expect, it } from 'vitest'

// Adding a transaction is the app's primary action and used to be reachable
// only from the Transactions view. These are the contracts that keep it global.
describe('global add-transaction action', () => {
  it('puts the trigger in the page header, which every authenticated view renders', () => {
    expect(pageHeader).toContain('useQuickTransaction')
    expect(pageHeader).toContain('@click="open"')
    expect(pageHeader).toContain("t('transactions.actions.add')")
  })

  it('keeps the trigger labelled when its text collapses on narrow screens', () => {
    expect(pageHeader).toContain(':aria-label="t(\'transactions.actions.add\')"')
    expect(pageHeader).toContain('<span class="hidden sm:inline">')
  })

  it('mounts exactly one modal host, next to the trigger', () => {
    expect(pageHeader).toContain('<QuickTransactionHost />')
    expect(pageHeader.match(/<QuickTransactionHost/g)).toHaveLength(1)
  })

  it('defers the modal chunk until the action is used for the first time', () => {
    expect(quickTransactionHost).toContain('defineAsyncComponent')
    expect(quickTransactionHost).toContain('v-if="isOpen || hasBeenOpened"')
  })

  it('records the onboarding milestone on creation only, never on an edit', () => {
    expect(quickTransactionHost).toContain('notifyTransactionCreated()')
    expect(quickTransactionHost).toContain('mode="create"')
    // The view's own instance is the edit path and must not claim the milestone.
    expect(transactionsView).not.toContain('notifyTransactionCreated')
    expect(transactionsView).toContain('mode="edit"')
  })

  it('reloads the transactions list when a transaction is created elsewhere', () => {
    expect(transactionsView).toContain('onCreated(reload)')
  })
})

describe('first click of a brand-new user', () => {
  it('explains the dead end instead of showing a form that can never be saved', async () => {
    const modal = (await import('../dashboard/AddTransactionModal.vue?raw')).default as string
    // Without accounts `isSaveDisabled` is permanently true.
    expect(modal).toContain('isBlockedByNoAccounts')
    expect(modal).toContain("t('transactionModal.noAccountsTitle')")
    expect(modal).toContain("router.push({ name: 'accounts' })")
  })

  it('offers the copy in every locale', async () => {
    for (const locale of ['en', 'es', 'pt']) {
      const source = (await import(`../../i18n/locales/${locale}.ts?raw`)).default as string
      expect(source, locale).toContain('noAccountsTitle')
      expect(source, locale).toContain('noAccountsBody')
      expect(source, locale).toContain('noAccountsAction')
    }
  })
})

describe('views that render data a new transaction invalidates', () => {
  const subscribers: Record<string, string> = {
    DashboardView: 'onCreated(loadDashboard)',
    AccountsView: 'onCreated(fetchAccounts)',
    BudgetsView: 'onCreated(loadBudgets)',
    ReportsView: 'onCreated(loadReports)',
  }

  for (const [name, call] of Object.entries(subscribers)) {
    it(`${name} refreshes itself`, async () => {
      const source = (await import(`../dashboard/${name}.vue?raw`)).default as string
      expect(source).toContain(call)
    })
  }
})
