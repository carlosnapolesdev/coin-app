import { useLocale } from '../composables/useLocale'

const INTL_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
}

const toIntlLocale = (code: string): string => INTL_LOCALE_MAP[code] ?? 'en-US'

export const parseDateOnly = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export const formatCurrency = (amount: number): string => {
  const { locale } = useLocale()
  return amount.toLocaleString(toIntlLocale(locale.value), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const formatDate = (date: Date | string, opts: Intl.DateTimeFormatOptions): string => {
  const { locale } = useLocale()
  const d = typeof date === 'string'
    ? (/^\d{4}-\d{2}-\d{2}$/.test(date) ? parseDateOnly(date) : new Date(date))
    : date
  return d.toLocaleDateString(toIntlLocale(locale.value), opts)
}

export const formatMonthYear = (date: Date): string => {
  const { locale } = useLocale()
  return date.toLocaleString(toIntlLocale(locale.value), { month: 'long', year: 'numeric' })
}