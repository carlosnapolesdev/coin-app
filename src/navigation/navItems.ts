// Single source of truth for primary navigation. Consumed by the desktop
// Sidebar and the mobile nav drawer; consumers translate labelKey with t().
export interface NavItem {
  icon: string
  routeName: string
  labelKey: string
}

export const NAV_ITEMS: NavItem[] = [
  { icon: 'grid_view', routeName: 'dashboard', labelKey: 'sidebar.nav.dashboard' },
  { icon: 'account_balance_wallet', routeName: 'accounts', labelKey: 'sidebar.nav.accounts' },
  { icon: 'receipt_long', routeName: 'transactions', labelKey: 'sidebar.nav.transactions' },
  { icon: 'pie_chart', routeName: 'budgets', labelKey: 'sidebar.nav.budgets' },
  { icon: 'flag', routeName: 'goals', labelKey: 'sidebar.nav.goals' },
  { icon: 'event_repeat', routeName: 'recurring', labelKey: 'sidebar.nav.recurring' },
  { icon: 'bar_chart', routeName: 'reports', labelKey: 'sidebar.nav.reports' },
  { icon: 'category', routeName: 'categories', labelKey: 'sidebar.nav.categories' },
  { icon: 'settings', routeName: 'settings', labelKey: 'sidebar.nav.settings' },
]
