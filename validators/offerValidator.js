// Server-side validation for the "Offer help" form.
const { SUPPORT_MODES } = require('../config/constants');

const text = (value) => (typeof value === 'string' ? value.trim() : '');

function validateOffer(body) {
  const values = {
    message: text(body.message),
    preferredMode: text(body.preferredMode),
  };
  const errors = {};

  if (values.message.length < 10) errors.message = 'Message must be at least 10 characters.';
  else if (values.message.length > 1000) errors.message = 'Message must be 1000 characters or fewer.';

  if (!Object.hasOwn(SUPPORT_MODES, values.preferredMode)) {
    errors.preferredMode = 'Choose how you’d like to help.';
  }

  return { values, errors };
}

module.exports = { validateOffer };
