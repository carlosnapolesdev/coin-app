import type { MessageSchema } from './locales/en'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}