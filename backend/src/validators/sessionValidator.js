// Server-side validation for "Propose new details" on a help session.
const { SUPPORT_MODES } = require('../config/constants');
const { toDateTimeLocal } = require('../utils/format');
const { text, isValidDateTimeLocal, toDbDateTime } = require('./common');

// `session` is the current row, used to reject a proposal that changes nothing.
function validateProposal(body, session) {
  const values = {
    mode: text(body.mode),
    scheduledAt: text(body.scheduledAt),
    locationLabel: text(body.locationLabel),
  };
  const errors = {};

  if (!Object.hasOwn(SUPPORT_MODES, values.mode)) errors.mode = 'Choose a support type.';

  if (!values.scheduledAt) errors.scheduledAt = 'Choose a date and time.';
  else if (!isValidDateTimeLocal(values.scheduledAt)) errors.scheduledAt = 'Enter a valid date and time.';
  else if (new Date(values.scheduledAt) <= new Date()) errors.scheduledAt = 'Choose a time in the future.';

  // A meeting place is needed in person, and meaningless online
  if (values.mode === 'online') values.locationLabel = '';
  if (values.mode === 'in_person' && !values.locationLabel) {
    errors.locationLabel = 'Enter where you’ll meet.';
  } else if (values.locationLabel.length > 150) {
    errors.locationLabel = 'Location must be 150 characters or fewer.';
  }

  const unchanged =
    values.mode === session.mode &&
    values.scheduledAt === toDateTimeLocal(session.scheduled_at) &&
    values.locationLabel === (session.location_label || '');
  if (Object.keys(errors).length === 0 && unchanged) {
    errors.mode = 'These are the same as the current details. Change something to propose it.';
  }

  return { values, errors };
}

// Validated values -> the format sessionService.propose() stores in MySQL.
function toDbProposal(values) {
  return {
    mode: values.mode,
    scheduledAt: toDbDateTime(values.scheduledAt),
    locationLabel: values.locationLabel || null,
  };
}

module.exports = { validateProposal, toDbProposal };
