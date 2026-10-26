// Small helpers shared by the form validators.
const { toDateTimeLocal } = require('../utils/format');

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Form fields arrive as strings, but a crafted request could send an array or nothing.
const text = (value) => (typeof value === 'string' ? value.trim() : '');

// True for a real date in <input type="datetime-local"> format ("2026-10-16T14:30").
// The round-trip check rejects impossible dates such as Feb 31 (which Date would roll over).
function isValidDateTimeLocal(value) {
  if (!DATETIME_LOCAL_PATTERN.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && toDateTimeLocal(date) === value;
}

// "2026-10-16T14:30" -> "2026-10-16 14:30:00" (MySQL DATETIME), or null when empty.
function toDbDateTime(value) {
  return value ? `${value.replace('T', ' ')}:00` : null;
}

module.exports = { text, isValidDateTimeLocal, toDbDateTime };
