import axios from 'axios'

const CODE_KEYS: Record<string, string> = {
  GOOGLE_EMAIL_UNVERIFIED: 'auth.google.errors.emailUnverified',
  GOOGLE_TOKEN_INVALID: 'auth.google.errors.tokenInvalid',
}

export function googleErrorMessage(
  err: unknown,
  t: (key: string) => string,
): string {
  if (axios.isAxiosError(err)) {
    const code = (err.response?.data as { code?: string } | undefined)?.code
    if (code && CODE_KEYS[code]) return t(CODE_KEYS[code])
  }
  return t('auth.google.errors.generic')
}
