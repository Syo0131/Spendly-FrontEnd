import { Pipe, PipeTransform } from '@angular/core';
import { FALLBACK_ICON, resolveIconName } from './lucide';

/**
 * Representative Lucide icon per finance category, keyed by the category's
 * normalized name (accent-insensitive, ES + EN). This is more reliable than the
 * backend `category.icons` field (arbitrary Material names), so it takes
 * priority; the backend icon is used only as a secondary fallback.
 *
 * All values must be registered in LUCIDE_ICON_SET (see lucide.ts).
 */
const CATEGORY_ICON_BY_NAME: Record<string, string> = {
  // Food & groceries
  food: 'utensils',
  comida: 'utensils',
  alimentacion: 'utensils',
  alimentation: 'utensils',
  restaurante: 'utensils',
  groceries: 'shopping-basket',
  supermercado: 'shopping-basket',

  // Transport & travel
  transport: 'car',
  transporte: 'car',
  gasolina: 'fuel',
  gas: 'fuel',
  combustible: 'fuel',
  viajes: 'plane',
  travel: 'plane',

  // Home & maintenance
  housing: 'house',
  vivienda: 'house',
  hogar: 'house',
  home: 'house',
  mantenimiento: 'wrench',
  maintenance: 'wrench',

  // Utilities / services
  utilities: 'zap',
  servicios: 'zap',
  services: 'zap',

  // Entertainment & social
  entertainment: 'clapperboard',
  entretenimiento: 'clapperboard',
  ocio: 'clapperboard',
  vida_social: 'party-popper',
  social_life: 'party-popper',

  // Shopping & gifts
  shopping: 'shopping-bag',
  compras: 'shopping-bag',
  regalos: 'gift',
  gifts: 'gift',

  // Health & personal care
  health: 'heart-pulse',
  salud: 'heart-pulse',
  farmacia: 'pill',
  pharmacy: 'pill',
  cuidado_personal: 'sparkles',
  personal_care: 'sparkles',

  // Education
  education: 'graduation-cap',
  educacion: 'graduation-cap',

  // Income sources
  salary: 'banknote',
  salario: 'banknote',
  freelance: 'briefcase',

  // Investments & debts
  investment: 'trending-up',
  investments: 'trending-up',
  inversion: 'trending-up',
  inversiones: 'trending-up',
  deudas: 'credit-card',
  debts: 'credit-card',

  // Pets
  mascotas: 'paw-print',
  pets: 'paw-print',

  // Generic
  other: 'shapes',
  otros: 'shapes',
  general: 'shapes',
};

/** Normalize a category name: lowercase, strip accents, spaces/hyphens -> _. */
function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[\s-]+/g, '_');
}

/**
 * Resolve a representative Lucide icon name for a category.
 *
 * Usage: <app-icon [name]="cat.name | categoryIcon: cat.icons" />
 *  - First tries a representative icon by category name.
 *  - Then falls back to the backend Material icon (resolved to Lucide).
 *  - Finally falls back to a generic icon so a glyph always renders.
 */
@Pipe({ name: 'categoryIcon', standalone: true })
export class CategoryIconPipe implements PipeTransform {
  transform(name: string | null | undefined, backendIcon?: string | null): string {
    if (name) {
      const byName = CATEGORY_ICON_BY_NAME[normalizeCategoryName(name)];
      if (byName) return byName;
    }
    if (backendIcon) return resolveIconName(backendIcon);
    return FALLBACK_ICON;
  }
}
