import { beforeEach, describe, expect, it } from 'vitest'
import { i18n } from '../i18n'
import { applyHeadFor } from './head'

const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
const metaByName = (name: string) =>
  document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
const ogUrl = () => document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')

describe('applyHeadFor', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    i18n.global.locale.value = 'en'
  })

  it('sets canonical and og:url from the origin and the route path', () => {
    applyHeadFor({ path: '/login', name: 'login' })
    expect(canonical()?.href).toBe(`${window.location.origin}/login`)
    expect(ogUrl()?.content).toBe(`${window.location.origin}/login`)
  })

  it('updates existing tags instead of duplicating them', () => {
    applyHeadFor({ path: '/login', name: 'login' })
    applyHeadFor({ path: '/register', name: 'register' })
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(canonical()?.href).toBe(`${window.location.origin}/register`)
  })

  it('uses the route description key and follows the active locale', () => {
    applyHeadFor({ path: '/login', name: 'login' })
    const english = metaByName('description')?.content
    expect(english).toBe(i18n.global.t('meta.description.login'))

    i18n.global.locale.value = 'es'
    applyHeadFor({ path: '/login', name: 'login' })
    expect(metaByName('description')?.content).not.toBe(english)
  })

  it('falls back to the default description for private routes', () => {
    applyHeadFor({ path: '/dashboard', name: 'dashboard' })
    expect(metaByName('description')?.content).toBe(i18n.global.t('meta.description.default'))
  })

  it('adds noindex on 404 and password flows, and removes it elsewhere', () => {
    applyHeadFor({ path: '/nope', name: 'not-found' })
    expect(metaByName('robots')?.content).toBe('noindex')
    applyHeadFor({ path: '/forgot-password', name: 'forgot-password' })
    expect(metaByName('robots')?.content).toBe('noindex')
    applyHeadFor({ path: '/login', name: 'login' })
    expect(metaByName('robots')).toBeNull()
  })
})
