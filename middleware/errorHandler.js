// App-wide error handling middleware.

const isApiRequest = (req) => req.originalUrl.startsWith('/api/');

// No route matched -> 404
function notFound(req, res) {
  const message = "The page you're looking for doesn't exist or hasn't been built yet.";

  if (isApiRequest(req)) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  res.status(404).render('error', {
    pageTitle: 'Page not found',
    statusCode: 404,
    message,
  });
}

// Express 5 forwards errors thrown in async handlers here automatically.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) console.error(err);

  const message =
    statusCode >= 500 ? 'Something went wrong. Please try again later.' : err.message;

  // REST API requests get JSON; browser requests get an HTML page
  if (isApiRequest(req)) {
    return res.status(statusCode).json({ error: message });
  }

  const titles = { 401: 'Please log in', 403: 'Access denied', 404: 'Not found' };
  res.status(statusCode).render('error', {
    pageTitle: titles[statusCode] || 'Something went wrong',
    statusCode,
    message,
  });
}

module.exports = { notFound, errorHandler };
