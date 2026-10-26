// Shared helpers for list pages with filters in the query string (?q=...&page=2).

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

// Builds e.g. "/help?category=math&page=2" from the current filters.
// Values equal to their default are left out to keep URLs short.
function buildListUrl(basePath, defaults, filters, overrides = {}) {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(merged)) {
    if (value && value !== defaults[key]) params.set(key, value);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

// True when any filter (other than the page) differs from its default.
function hasActiveFilters(defaults, filters) {
  return Object.keys(defaults).some((key) => key !== 'page' && filters[key] !== defaults[key]);
}

module.exports = { pick, keyword, pageNumber, buildListUrl, hasActiveFilters };
