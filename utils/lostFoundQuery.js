// Reads search/filter/page values for /lost-found from the query string.
const {
  LOST_FOUND_TYPES,
  LOST_FOUND_CATEGORIES,
  LOST_FOUND_STATUSES,
} = require('../config/constants');
const listQuery = require('./listQuery');

// "Posted within" filter: value = number of days
const POSTED_WITHIN = {
  1: 'Last 24 hours',
  7: 'Last 7 days',
  30: 'Last 30 days',
};

const LIST_DEFAULTS = {
  q: '',
  type: '',
  category: '',
  posted: '',
  status: 'open', // resolved/closed posts are hidden unless asked for
  page: 1,
};

function parseListQuery(query) {
  const { pick } = listQuery;
  return {
    q: listQuery.keyword(query.q),
    type: pick(query.type, Object.keys(LOST_FOUND_TYPES), LIST_DEFAULTS.type),
    category: pick(query.category, Object.keys(LOST_FOUND_CATEGORIES), LIST_DEFAULTS.category),
    posted: pick(query.posted, Object.keys(POSTED_WITHIN), LIST_DEFAULTS.posted),
    status: pick(query.status, [...Object.keys(LOST_FOUND_STATUSES), 'all'], LIST_DEFAULTS.status),
    page: listQuery.pageNumber(query.page),
  };
}

const buildListUrl = (filters, overrides) =>
  listQuery.buildListUrl('/lost-found', LIST_DEFAULTS, filters, overrides);
const hasActiveFilters = (filters) => listQuery.hasActiveFilters(LIST_DEFAULTS, filters);

module.exports = { POSTED_WITHIN, parseListQuery, buildListUrl, hasActiveFilters };
