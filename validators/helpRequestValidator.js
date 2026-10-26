// Server-side validation for the create/edit help request form.
const { HELP_CATEGORIES, SUPPORT_MODES } = require('../config/constants');
const { toDateTimeLocal } = require('../utils/format');
const { text, isValidDateTimeLocal, toDbDateTime } = require('./common');

// `existing` is the current database row when editing (undefined when creating).
function validateHelpRequest(body, existing) {
  const values = {
    title: text(body.title),
    description: text(body.description),
    category: text(body.category),
    supportMode: text(body.supportMode),
    locationLabel: text(body.locationLabel),
    scheduledAt: text(body.scheduledAt),
  };
  const errors = {};

  if (values.title.length < 5) errors.title = 'Title must be at least 5 characters.';
  else if (values.title.length > 150) errors.title = 'Title must be 150 characters or fewer.';

  if (values.description.length < 10) errors.description = 'Description must be at least 10 characters.';
  else if (values.description.length > 5000) errors.description = 'Description must be 5000 characters or fewer.';

  if (!Object.hasOwn(HELP_CATEGORIES, values.category)) errors.category = 'Choose a category.';
  if (!Object.hasOwn(SUPPORT_MODES, values.supportMode)) errors.supportMode = 'Choose how you want to get help.';

  // A location only makes sense for in-person help
  if (values.supportMode === 'online') values.locationLabel = '';
  if (values.locationLabel.length > 150) errors.locationLabel = 'Location must be 150 characters or fewer.';

  if (values.scheduledAt) {
    const unchanged = existing && toDateTimeLocal(existing.scheduled_at) === values.scheduledAt;

    if (!isValidDateTimeLocal(values.scheduledAt)) errors.scheduledAt = 'Enter a valid date and time.';
    else if (!unchanged && new Date(values.scheduledAt) <= new Date()) {
      errors.scheduledAt = 'Choose a time in the future.';
    }
  }

  // Changing in person <-> online must be confirmed explicitly
  const modeChanged =
    existing && !errors.supportMode && values.supportMode !== existing.support_mode;
  if (modeChanged && body.confirmModeChange !== 'yes') {
    errors.confirmModeChange = 'Tick the box to confirm changing the support type.';
  }

  return { values, errors };
}

// Converts validated form values into the format stored in MySQL.
function toDbValues(values) {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    supportMode: values.supportMode,
    locationLabel: values.locationLabel || null,
    scheduledAt: toDbDateTime(values.scheduledAt),
  };
}

module.exports = { validateHelpRequest, toDbValues };
