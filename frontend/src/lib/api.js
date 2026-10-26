// Small fetch wrapper for the CampusLink API (same origin: Next.js forwards /api to Express).
// Every response is JSON; errors come back as { error, errors? } and are thrown as ApiError.

let csrfToken = '';

// Set from GET /api/auth/me and the login response (see AuthProvider).
export function setCsrfToken(token) {
  csrfToken = token || '';
}

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors || {}; // { field: message } for 422 validation errors
  }
}

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = csrfToken;

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Can’t reach the server. Check your connection and try again.');
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // e.g. an HTML error page from a proxy
  }

  if (!response.ok) {
    const message =
      (data && data.error) ||
      (response.status >= 500 ? 'Something went wrong. Please try again later.' : 'Request failed.');
    throw new ApiError(response.status, message, data && data.errors);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
};
