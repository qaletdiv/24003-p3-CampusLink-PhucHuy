// Formatting helpers shared by the pages.

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDateTime(value) {
  if (!value) return '';
  return dateTimeFormatter.format(new Date(value));
}

// "5m ago", "3h ago", "2d ago", then the date.
export function timeAgo(value) {
  if (!value) return '';
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 7) return `${Math.round(minutes / (60 * 24))}d ago`;
  return formatDateTime(value);
}

// Shorten long descriptions for list cards.
export function truncate(text, maxLength = 140) {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength).trimEnd() + '…';
}

// "1 member", "3 members"
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// Date -> "2026-10-16T14:30", the value format of <input type="datetime-local"> (local time).
export function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "Nguyen Van An" -> "NA"
export function initials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}
