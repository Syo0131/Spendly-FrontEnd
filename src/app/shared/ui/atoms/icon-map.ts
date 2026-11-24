export const FALLBACK_ICON = 'category';

export const SUPPORTED_ICONS = new Set<string>([
  'account_balance',
  'account_balance_wallet',
  'add',
  'add_circle',
  'apps',
  'arrow_circle_down',
  'arrow_circle_up',
  'arrow_downward',
  'arrow_forward',
  'arrow_upward',
  'auto_awesome',
  'battery_full',
  'bolt',
  'build',
  'calendar_today',
  'campaign',
  'category',
  'celebration',
  'check',
  'chevron_left',
  'chevron_right',
  'close',
  'construction',
  'dark_mode',
  'dashboard',
  'delete',
  'delete_forever',
  'delete_outline',
  'directions_car',
  'download',
  'edit',
  'error',
  'expand_less',
  'expand_more',
  'fitness_center',
  'flag',
  'flight',
  'history',
  'home',
  'link_off',
  'local_gas_station',
  'local_pharmacy',
  'logout',
  'medical_services',
  'menu',
  'more_horiz',
  'more_vert',
  'notifications',
  'payments',
  'pets',
  'pie_chart',
  'receipt',
  'receipt_long',
  'replay',
  'restaurant',
  'savings',
  'school',
  'settings',
  'shopping_bag',
  'shopping_cart',
  'sports_esports',
  'sync',
  'system_update',
  'translate',
  'trending_down',
  'trending_up',
  'wallet',
  'warning',
  'wifi',
  'work',
]);

/**
 * Resolves an icon name to a validated Material icon name, or FALLBACK_ICON.
 */
export function resolveIcon(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return FALLBACK_ICON;
  }
  const normalized = name.trim().toLowerCase();
  if (SUPPORTED_ICONS.has(normalized)) {
    return normalized;
  }
  return FALLBACK_ICON;
}
