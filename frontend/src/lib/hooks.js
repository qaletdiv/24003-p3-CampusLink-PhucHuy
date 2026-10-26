'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useApp } from '@/components/providers/AppProvider';
import { loginUrl } from '@/lib/safeRedirect';

// Sets the browser tab title, e.g. "Find Help – CampusLink".
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – CampusLink` : 'CampusLink';
  }, [title]);
}

// Loads GET /api{path}. Pass null to skip. Returns { data, error, loading, reload }.
// A 401 (session expired) sends the user to Login and back here afterwards.
export function useApi(path) {
  const router = useRouter();
  const pathname = usePathname();
  const [version, setVersion] = useState(0);
  // `key` records which request the data belongs to. While a newer request for the same endpoint
  // runs (reload, other filters), the old data stays on screen and `loading` is true.
  const [state, setState] = useState({ key: null, path: null, data: null, error: null });
  const requestKey = path ? `${version}:${path}` : null;
  const endpoint = (value) => (value || '').split('?')[0];
  const sameEndpoint = endpoint(state.path) === endpoint(path);

  useEffect(() => {
    if (!requestKey) return undefined;
    let active = true;

    api
      .get(path)
      .then((data) => active && setState({ key: requestKey, path, data, error: null }))
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) router.replace(loginUrl(pathname + window.location.search));
        setState({ key: requestKey, path, data: null, error });
      });

    return () => {
      active = false;
    };
  }, [requestKey, path, router, pathname]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return {
    data: sameEndpoint ? state.data : null,
    error: sameEndpoint ? state.error : null,
    loading: requestKey !== null && state.key !== requestKey,
    reload,
  };
}

// Runs an API call that changes data (a button or form submit).
//  - busy is true while it runs (buttons show a spinner and are disabled)
//  - validation errors (422) are returned in `errors` for the form to show next to each field
//  - other errors are shown as a flash message
// `run` resolves to the response, or null when the call failed.
export function useAction() {
  const { notify } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const run = useCallback(
    async (call) => {
      setBusy(true);
      try {
        const result = await call();
        setErrors({});
        return result;
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        if (error.status === 422 && Object.keys(error.errors).length > 0) {
          setErrors(error.errors);
        } else if (error.status === 401) {
          notify('Please log in to continue.', 'info', '/login');
          router.push(loginUrl(pathname));
        } else {
          setErrors({});
          notify(error.message, 'error');
        }
        return null;
      } finally {
        setBusy(false);
      }
    },
    [notify, router, pathname]
  );

  return { busy, errors, setErrors, run };
}
