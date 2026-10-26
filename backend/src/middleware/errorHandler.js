// App-wide error handling middleware. Every error is answered as { error: message }
// (plus { errors: { field: message } } when a form failed validation).

// No route matched -> 404
function notFound(req, res) {
  res.status(404).json({ error: 'Endpoint not found.' });
}

// Express 5 forwards errors thrown in async handlers here automatically.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // express.json() rejects malformed or oversized bodies with a 4xx status
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) console.error(err);

  const message = statusCode >= 500 ? 'Something went wrong. Please try again later.' : err.message;

  // Validation failures (see assertValid) also list the problem with each field
  res.status(statusCode).json(err.errors ? { error: message, errors: err.errors } : { error: message });
}

module.exports = { notFound, errorHandler };
