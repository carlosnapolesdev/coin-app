import { i18n } from '../i18n'

type HeadRoute = { path: string; name?: unknown }

const DESCRIPTION_KEYS: Record<string, string> = {
  login: 'meta.description.login',
  register: 'meta.description.register',
  'legal-privacy': 'meta.description.legalPrivacy',
  'legal-terms': 'meta.description.legalTerms',
  'legal-cookies': 'meta.description.legalCookies',
  'legal-legal-notice': 'meta.description.legalNotice',
}

const NOINDEX_ROUTES = new Set(['not-found', 'forgot-password', 'reset-password'])

const upsertMeta = (attr: 'name' | 'property', id: string, content: string): void => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${id}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, id)
    document.head.appendChild(element)
  }
  element.content = content
}

export const applyHeadFor = (route: HeadRoute): void => {
  const url = window.location.origin + route.path
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }

  canonical.href = url
  upsertMeta('property', 'og:url', url)

  const routeName = typeof route.name === 'string' ? route.name : ''
  const descriptionKey = DESCRIPTION_KEYS[routeName] ?? 'meta.description.default'
  upsertMeta('name', 'description', i18n.global.t(descriptionKey))

  if (NOINDEX_ROUTES.has(routeName)) {
    upsertMeta('name', 'robots', 'noindex')
  } else {
    document.head.querySelector('meta[name="robots"]')?.remove()
  }
}
