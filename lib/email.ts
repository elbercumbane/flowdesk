/** Accept any local-part@server value. Browser `type="email"` is stricter than this. */
export const EMAIL_PATTERN = String.raw`[^\s@]+@[^\s@]+`

export const EMAIL_TITLE = 'Use an email with @ and the mail server, e.g. name@company.com'

export function isLooseEmail(value: string) {
  return /^[^\s@]+@[^\s@]+$/.test(value.trim())
}
