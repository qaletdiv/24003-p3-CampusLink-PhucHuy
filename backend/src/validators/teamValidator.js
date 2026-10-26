// Server-side validation for teams, team sessions/events and Team Signals.
const { toDateTimeLocal } = require('../utils/format');
const { text, isValidDateTimeLocal, toDbDateTime } = require('./common');
const { SIGNAL_DURATIONS } = require('../services/teamSignalService');

function validateTeam(body) {
  const values = { name: text(body.name), description: text(body.description) };
  const errors = {};

  if (values.name.length < 3) errors.name = 'Team name must be at least 3 characters.';
  else if (values.name.length > 100) errors.name = 'Team name must be 100 characters or fewer.';

  if (values.description.length < 10) errors.description = 'Description must be at least 10 characters.';
  else if (values.description.length > 1000) errors.description = 'Description must be 1000 characters or fewer.';

  return { values, errors };
}

// `existing` is the current row when editing: an unchanged start time may already be in the past.
function validateTeamSession(body, existing) {
  const values = {
    title: text(body.title),
    description: text(body.description),
    startsAt: text(body.startsAt),
    endsAt: text(body.endsAt),
    locationLabel: text(body.locationLabel),
  };
  const errors = {};

  if (values.title.length < 3) errors.title = 'Title must be at least 3 characters.';
  else if (values.title.length > 150) errors.title = 'Title must be 150 characters or fewer.';

  if (values.description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.';
  if (values.locationLabel.length > 150) errors.locationLabel = 'Location must be 150 characters or fewer.';

  const startUnchanged = existing && toDateTimeLocal(existing.starts_at) === values.startsAt;
  if (!values.startsAt) errors.startsAt = 'Choose a start time.';
  else if (!isValidDateTimeLocal(values.startsAt)) errors.startsAt = 'Enter a valid start time.';
  else if (!startUnchanged && new Date(values.startsAt) <= new Date()) {
    errors.startsAt = 'Choose a start time in the future.';
  }

  if (!values.endsAt) errors.endsAt = 'Choose an end time.';
  else if (!isValidDateTimeLocal(values.endsAt)) errors.endsAt = 'Enter a valid end time.';
  else if (!errors.startsAt && new Date(values.endsAt) <= new Date(values.startsAt)) {
    errors.endsAt = 'The end time must be after the start time.';
  }

  return { values, errors };
}

function toDbTeamSession(values) {
  return {
    title: values.title,
    description: values.description || null,
    startsAt: toDbDateTime(values.startsAt),
    endsAt: toDbDateTime(values.endsAt),
    locationLabel: values.locationLabel || null,
  };
}

function validateSignal(body) {
  const values = {
    message: text(body.message),
    locationLabel: text(body.locationLabel),
    durationMinutes: text(body.durationMinutes),
  };
  const errors = {};

  if (values.message.length < 3) errors.message = 'Message must be at least 3 characters.';
  else if (values.message.length > 280) errors.message = 'Message must be 280 characters or fewer.';

  if (!values.locationLabel) errors.locationLabel = 'Say where to meet.';
  else if (values.locationLabel.length > 150) errors.locationLabel = 'Location must be 150 characters or fewer.';

  // Every signal must expire: only the fixed durations are accepted
  if (!Object.hasOwn(SIGNAL_DURATIONS, values.durationMinutes)) {
    errors.durationMinutes = 'Choose how long the signal stays active.';
  }

  return { values, errors };
}

module.exports = { validateTeam, validateTeamSession, toDbTeamSession, validateSignal };
