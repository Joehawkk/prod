export function isValidAvatar(url: string | null | undefined): boolean {
  if (!url || url === 'string') return false
  return url.startsWith('http') || url.startsWith('data:image/')
}
