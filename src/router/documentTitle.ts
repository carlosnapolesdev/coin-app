import type { RouteLocationNormalized } from 'vue-router'
import { i18n } from '../i18n'

export const BRAND = 'Crecik'

/**
 * Build the browser tab title for a route: "View — Crecik", falling back to
 * the bare brand when the route declares no `meta.title` key. The title key is
 * resolved through i18n so the tab follows the active language.
 */
export const documentTitleFor = (
  meta: RouteLocationNormalized['meta'],
  translate: (key: string) => string = (key) => i18n.global.t(key),
): string => {
  const key = typeof meta.title === 'string' ? meta.title : undefined
  return key ? `${translate(key)} — ${BRAND}` : BRAND
}
