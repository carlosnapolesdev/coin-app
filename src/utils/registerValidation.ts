export interface RegisterStep1Input {
  fullName: string
  email: string
  password: string
  acceptedLegal: boolean
}

export type RegisterStep1Field = 'fullName' | 'email' | 'password' | 'acceptedLegal'
export type RegisterStep1Errors = Partial<Record<RegisterStep1Field, string>>

export interface RegisterStep1Messages {
  fullNameRequired: string
  emailRequired: string
  passwordTooShort: string
  consentRequired: string
}

export const validateRegisterStep1 = (
  input: RegisterStep1Input,
  messages: RegisterStep1Messages,
): RegisterStep1Errors => {
  const errors: RegisterStep1Errors = {}
  if (!input.fullName) errors.fullName = messages.fullNameRequired
  if (!input.email) errors.email = messages.emailRequired
  if (!input.password || input.password.length < 8) errors.password = messages.passwordTooShort
  if (!input.acceptedLegal) errors.acceptedLegal = messages.consentRequired
  return errors
}
