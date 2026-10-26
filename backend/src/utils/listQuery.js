// Shared helpers for list endpoints with filters in the query string (?q=...&page=2).

// Picks `value` only if it is one of `allowed`, otherwise the fallback.
function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

// A trimmed keyword, or '' for anything that isn't a string (e.g. ?q=a&q=b).
function keyword(value, maxLength = 100) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

// A positive page number, defaulting to 1.
function pageNumber(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

// True when any filter (other than the page) differs from its default.
function hasActiveFilters(defaults, filters) {
  return Object.keys(defaults).some((key) => key !== 'page' && filters[key] !== defaults[key]);
}

// The standard JSON shape of a paginated list endpoint.
function listResponse(items, { total, page, totalPages, pageSize }, extra = {}) {
  return { data: items, pagination: { page, pageSize, total, totalPages }, ...extra };
}

module.exports = { pick, keyword, pageNumber, hasActiveFilters, listResponse };
