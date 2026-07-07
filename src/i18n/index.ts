import { createI18n } from 'vue-i18n'
import en, { type MessageSchema } from './locales/en'
import es from './locales/es'
import pt from './locales/pt'

export type SupportedLocale = 'en' | 'es' | 'pt'

export const i18n = createI18n<[MessageSchema], SupportedLocale, false>({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es, pt },
})
