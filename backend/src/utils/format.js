// Date helpers used by the validators.

// Date -> "2026-10-16T14:30", the value format of <input type="datetime-local"> (local time).
function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = { toDateTimeLocal };
