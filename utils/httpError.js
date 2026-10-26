// Creates an Error carrying an HTTP status code; errorHandler turns it into the right response.
function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Turns a URL parameter like "12" into a number; returns null for anything else ("abc", "1.5", "-3").
function parseId(value) {
  return /^[1-9]\d{0,14}$/.test(value) ? Number(value) : null;
}

module.exports = { httpError, parseId };
