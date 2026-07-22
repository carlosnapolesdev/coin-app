import hero from './LandingHero.vue?raw'
import features from './LandingFeatures.vue?raw'
import how from './LandingHowItWorks.vue?raw'
import footer from './LandingFooter.vue?raw'
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

  it('footer shows login copyright, the legal links and the language toggle in one bar', () => {
    expect(footer).toContain("t('auth.login.footer')")
    expect(footer).toContain('LEGAL_SLUGS')
    expect(footer).toContain('LEGAL_ROUTE_PATHS')
    expect(footer).toContain('LanguageToggle')
  })

  it('LandingView composes the four sections', () => {
    for (const tag of ['LandingHero', 'LandingFeatures', 'LandingHowItWorks', 'LandingFooter']) {
      expect(view).toContain(tag)
    }
  })
})