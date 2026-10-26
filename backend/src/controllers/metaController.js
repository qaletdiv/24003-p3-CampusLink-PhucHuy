// Fixed option lists (categories, statuses, ...) with their display labels.
// The frontend loads them once, so the labels are defined in one place only: config/constants.js.
const constants = require('../config/constants');
const { SORT_OPTIONS } = require('../utils/helpRequestQuery');
const { POSTED_WITHIN } = require('../utils/lostFoundQuery');
const { SIGNAL_DURATIONS } = require('../services/teamSignalService');

// GET /api/meta
function show(req, res) {
  res.json({
    ...constants,
    HELP_SORT_OPTIONS: SORT_OPTIONS,
    LOST_FOUND_POSTED_WITHIN: POSTED_WITHIN,
    SIGNAL_DURATIONS,
  });
}

module.exports = { show };
