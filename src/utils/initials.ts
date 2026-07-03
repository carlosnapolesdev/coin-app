export function getInitials(fullName?: string | null, email?: string | null): string {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
  }
  if (words.length === 1) {
    return words[0]![0]!.toUpperCase()
  }
  const emailChar = (email ?? '').trim().match(/[a-z0-9]/i)?.[0]
  return emailChar ? emailChar.toUpperCase() : '?'
}
