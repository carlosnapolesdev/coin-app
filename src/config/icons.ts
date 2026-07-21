// Single source of truth for every Material Symbols glyph the app can render.
// The font shipped to the browser is subset to exactly these names
// (scripts/subset-icons.mjs), so anything missing here renders blank.
// The guard test in icons.test.ts fails if a template uses an icon absent
// from UI_ICONS; the category picker only offers CATEGORY_ICONS.

// Icons used by the app's own chrome: buttons, states, navigation, toggles.
// Includes script-level references (typeIconMap, steps, iconForType) that the
// guard test does not scan, but the subset must still cover.
export const UI_ICONS = [
  'account_balance', 'account_balance_wallet', 'add', 'arrow_back', 'arrow_forward',
  'attach_money', 'badge', 'bar_chart', 'block', 'calendar_today', 'call_made', 'call_received',
  'call_split', 'category', 'celebration', 'check', 'check_circle', 'chevron_left',
  'chevron_right', 'close', 'contrast', 'credit_card', 'currency_exchange', 'dark_mode',
  'dashboard_customize', 'delete', 'delete_sweep', 'donut_large', 'download', 'edit',
  'edit_note', 'error', 'event', 'event_busy', 'event_repeat', 'event_upcoming',
  'expand_less', 'expand_more', 'fact_check', 'flag', 'folder_open', 'grid_view',
  'help', 'home', 'info', 'label', 'light_mode', 'lightbulb', 'link_off', 'lock',
  'lock_reset', 'logout', 'mail', 'mark_email_read', 'menu', 'money_off',
  'notifications', 'notifications_none', 'payments', 'pending', 'person_add', 'pie_chart',
  'play_arrow', 'progress_activity', 'radio_button_unchecked', 'receipt_long',
  'remove', 'restore', 'rocket_launch', 'savings', 'search', 'settings', 'shield',
  'speed', 'swap_horiz', 'task_alt', 'translate', 'unfold_more', 'upload_file',
  'verified_user', 'visibility', 'visibility_off', 'warning',
] as const

// Curated, finance-oriented set offered by the category icon picker.
// Superset of the default-category icons seeded by coin-api.
export const CATEGORY_ICONS = [
  'account_balance', 'account_balance_wallet', 'apparel', 'attach_money', 'auto_stories',
  'backpack', 'bakery_dining', 'bar_chart', 'beach_access', 'bed', 'bolt', 'brunch_dining',
  'business_center', 'cake', 'calculate', 'card_giftcard', 'casino', 'cell_tower', 'chair',
  'checkroom', 'child_care', 'cleaning_services', 'commute', 'computer', 'corporate_fare',
  'credit_card', 'currency_exchange', 'dentistry', 'devices', 'diamond', 'directions_bike',
  'directions_bus', 'directions_car', 'diversity_3', 'electric_car', 'electrical_services',
  'emoji_events', 'engineering', 'escalator_warning', 'ev_station', 'family_restroom',
  'fastfood', 'festival', 'fitness_center', 'flight', 'golf_course', 'groups', 'handyman',
  'headphones', 'health_and_safety', 'hiking', 'home', 'home_repair_service', 'hotel',
  'house', 'icecream', 'kitchen', 'label', 'laptop_mac', 'liquor', 'local_bar',
  'local_cafe', 'local_fire_department', 'local_gas_station', 'local_grocery_store',
  'local_hospital', 'local_mall', 'local_parking', 'local_pharmacy', 'local_pizza',
  'local_taxi', 'loyalty', 'luggage', 'lunch_dining', 'map', 'medical_services',
  'medication', 'memory', 'menu_book', 'monitor_heart', 'more_horiz', 'moped', 'movie',
  'music_note', 'nightlife', 'paid', 'park', 'payments', 'percent', 'pending', 'pets',
  'plumbing', 'pool', 'price_check', 'print', 'propane', 'psychology', 'public',
  'ramen_dining', 'receipt', 'receipt_long', 'redeem', 'request_quote', 'restaurant',
  'restaurant_menu', 'router', 'sailing', 'savings', 'school', 'science',
  'self_improvement', 'sell', 'shield', 'shopping_bag', 'shopping_cart', 'sim_card',
  'smartphone', 'spa', 'sports_basketball', 'sports_esports', 'sports_soccer',
  'stadia_controller', 'star', 'storefront', 'stroller', 'styler', 'subscriptions',
  'subway', 'theaters', 'toys', 'train', 'tram', 'travel_explore', 'trending_down',
  'trending_up', 'tv', 'two_wheeler', 'universal_currency_alt', 'vaccines',
  'videogame_asset', 'volunteer_activism', 'wallet', 'watch', 'water_drop', 'weekend',
  'wifi', 'work',
] as const

// Finance-oriented set offered by the account icon picker (AccountsView).
// Kept separate from CATEGORY_ICONS so an account picker offers "savings" and
// "credit_card", not "restaurant" and "pets". Includes the default account
// icon ('account_balance').
export const ACCOUNT_ICONS = [
  'account_balance', 'account_balance_wallet', 'attach_money', 'card_giftcard',
  'credit_card', 'currency_bitcoin', 'currency_exchange', 'diamond', 'local_atm',
  'monitoring', 'paid', 'payments', 'price_check', 'real_estate_agent', 'receipt_long',
  'redeem', 'request_quote', 'savings', 'swap_horiz', 'sync_alt', 'toll', 'trending_up',
  'universal_currency_alt', 'wallet',
] as const

// Every glyph the subset must cover: app chrome, category picker, account picker.
export const ALL_ICONS: string[] = [
  ...new Set<string>([...UI_ICONS, ...CATEGORY_ICONS, ...ACCOUNT_ICONS]),
]