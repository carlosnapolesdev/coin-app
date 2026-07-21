// Best-effort preselection for the welcome screen. Language tags carry a region
// subtag (es-AR, pt-BR); map that region to a currency, defaulting to USD.
const REGION_CURRENCY: Record<string, string> = {
  US: 'USD', AR: 'ARS', BR: 'BRL', MX: 'MXN', CL: 'CLP', CO: 'COP',
  PE: 'PEN', UY: 'UYU', GB: 'GBP', ES: 'EUR', DE: 'EUR', FR: 'EUR',
  IT: 'EUR', PT: 'EUR', CA: 'CAD', AU: 'AUD', JP: 'JPY',
}

export function guessBaseCurrency(codes: string[], language: string): string {
  const region = language.split('-')[1]?.toUpperCase()
  const guess = region ? REGION_CURRENCY[region] : undefined
  if (guess && codes.includes(guess)) return guess
  if (codes.includes('USD')) return 'USD'
  return codes[0]
}
