/** Format a date as a medium-length, locale-aware string (e.g. "Aug 18, 2026"). */
export function formatDate(date: Date | string | number, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date))
}

/** Format a number with locale-aware thousand separators. */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value)
}

/** Truncate a string to `maxLength` characters and append an ellipsis. */
export function truncate(value: string, maxLength = 80): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trimEnd()}...`
}

/** Derive up to two uppercase initials from a full name (e.g. "Jane Doe" → "JD"). */
export function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

/** Format a date relative to now (e.g. "3 hours ago", "2 days ago"). */
export function timeAgo(date: Date | string | number, locale = 'en'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diffMs = new Date(date).getTime() - Date.now()
  const seconds = Math.round(diffMs / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)

  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  if (Math.abs(days) < 30) return rtf.format(days, 'day')
  return formatDate(date)
}
