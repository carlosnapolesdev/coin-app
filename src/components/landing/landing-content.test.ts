import hero from './LandingHero.vue?raw'
import features from './LandingFeatures.vue?raw'
import how from './LandingHowItWorks.vue?raw'
import view from '../LandingView.vue?raw'
import { describe, expect, it } from 'vitest'

describe('landing content contracts', () => {
  it('hero links the primary CTA to registration and secondary to login', () => {
    expect(hero).toContain('to="/register"')
    expect(hero).toContain('to="/login"')
    expect(hero).toContain("t('landing.hero.title')")
    expect(hero).toContain("t('landing.hero.subtitle')")
  })

  it('hero renders the dashboard screenshot with an i18n alt text', () => {
    expect(hero).toContain('dashboard-preview')
    expect(hero).toContain('landing.hero.screenshotAlt')
  })

  it('features section renders all five feature blocks', () => {
    for (const key of ['accounts', 'budgets', 'goals', 'recurring', 'reports']) {
      expect(features).toContain(`landing.features.${key}.title`)
      expect(features).toContain(`landing.features.${key}.body`)
    }
  })

  it('how-it-works renders three steps', () => {
    for (const key of ['step1', 'step2', 'step3']) {
      expect(how).toContain(`landing.how.${key}.title`)
    }
  })

  it('features and steps sections do not force full-viewport height', () => {
    expect(features).not.toContain('min-h-svh')
    expect(how).not.toContain('min-h-svh')
  })

  it('closes with the Login-style footer: copyright line plus legal links', () => {
    expect(view).toContain("t('auth.login.footer')")
    expect(view).toContain('LegalFooter')
    expect(view).not.toContain('LandingFooter')
  })

  it('mounts the shared TopHeader with sign-in and create-account CTAs', () => {
    expect(view).toContain('TopHeader')
    expect(view).toContain('to="/register"')
    expect(view).toContain('to="/login"')
    expect(view).toContain('landing.cta.createAccount')
    expect(view).toContain('landing.cta.signIn')
  })

  it('LandingView composes header, three sections and the legal footer', () => {
    for (const tag of ['TopHeader', 'LandingHero', 'LandingFeatures', 'LandingHowItWorks', 'LegalFooter']) {
      expect(view).toContain(tag)
    }
    expect(view).not.toContain('LandingFooter')
  })
})
