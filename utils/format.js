// Formatting helpers for EJS views (attached to app.locals in app.js).

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatDateTime(value) {
  if (!value) return '';
  return dateTimeFormatter.format(new Date(value));
}

// Shorten long descriptions for list cards.
function truncate(text, maxLength = 140) {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength).trimEnd() + '…';
}

// Date -> "2026-10-16T14:30", the value format of <input type="datetime-local"> (local time).
function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = { formatDateTime, truncate, toDateTimeLocal };
