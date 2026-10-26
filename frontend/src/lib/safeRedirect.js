// Only allow redirects to pages on this site.
// Without this check, a link like /login?returnTo=https://evil.example could send
// users to a fake site right after they log in (an "open redirect").
export function safeReturnTo(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  // Resolve against a dummy origin: anything that ends up on another host is rejected (e.g. "/\evil.example").
  const resolved = new URL(value, 'http://campuslink.local');
  if (resolved.origin !== 'http://campuslink.local') return fallback;

  return resolved.pathname + resolved.search;
}

export function loginUrl(returnTo) {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
