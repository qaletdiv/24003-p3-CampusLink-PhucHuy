// Creates an Error carrying an HTTP status code; errorHandler turns it into the right response.
function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Throws a 422 carrying the validator's { field: message } map, so the frontend can show
// each message next to its field. Does nothing when there are no errors.
function assertValid(errors) {
  if (Object.keys(errors).length === 0) return;
  const error = httpError(422, 'Please fix the highlighted fields.');
  error.errors = errors;
  throw error;
}

// Turns a URL parameter like "12" into a number; returns null for anything else ("abc", "1.5", "-3").
function parseId(value) {
  return /^[1-9]\d{0,14}$/.test(value) ? Number(value) : null;
}

module.exports = { httpError, assertValid, parseId };
