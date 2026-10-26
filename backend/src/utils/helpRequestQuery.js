// Reads search/filter/sort/page values for GET /api/help-requests from the query string.
// Anything not on the allow-list falls back to its default, so bad input never reaches SQL.
const {
  HELP_CATEGORIES,
  SUPPORT_MODES,
  HELP_REQUEST_STATUSES,
} = require('../config/constants');
const listQuery = require('./listQuery');

const SORT_OPTIONS = {
  newest: 'Newest first',
  soonest: 'Soonest scheduled',
};

const LIST_DEFAULTS = {
  q: '',
  category: '',
  mode: '',
  status: 'open', // the list shows requests that still need help by default
  sort: 'newest',
  page: 1,
};

function parseListQuery(query) {
  const { pick } = listQuery;
  return {
    q: listQuery.keyword(query.q),
    category: pick(query.category, Object.keys(HELP_CATEGORIES), LIST_DEFAULTS.category),
    mode: pick(query.mode, Object.keys(SUPPORT_MODES), LIST_DEFAULTS.mode),
    status: pick(query.status, [...Object.keys(HELP_REQUEST_STATUSES), 'all'], LIST_DEFAULTS.status),
    sort: pick(query.sort, Object.keys(SORT_OPTIONS), LIST_DEFAULTS.sort),
    page: listQuery.pageNumber(query.page),
  };
}

const hasActiveFilters = (filters) => listQuery.hasActiveFilters(LIST_DEFAULTS, filters);

module.exports = { SORT_OPTIONS, parseListQuery, hasActiveFilters };
