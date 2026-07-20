import axios from 'axios'

// Statuses the API uses to tell the user that what they submitted was wrong:
// a mistyped current password, a duplicate tag name, a failed validation.
const USER_CORRECTABLE_STATUSES = new Set([400, 401, 403, 409, 422])

/**
 * True when an error is the API rejecting user input, rather than a fault.
 *
 * Reporting these was drowning the digest: every user mistyping their current
 * password mailed the administrator a "client error" for the system working as
 * designed. Not reporting them is not the same as discarding them — the caller
 * still shows the rejection on screen, so the failure is handled, visible and
 * actionable by the person who caused it.
 *
 * Only use this where the user submitted something. The same 400 coming back
 * from a page load is a bug, and the status alone cannot tell the two apart:
 * that judgement belongs to the call site.
 */
export const isExpectedApiRejection = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status !== undefined && USER_CORRECTABLE_STATUSES.has(status)
}
