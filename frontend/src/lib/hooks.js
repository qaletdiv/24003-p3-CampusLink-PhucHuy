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
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    setState((current) => ({ ...current, loading: true }));

    api
      .get(path)
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) router.replace(loginUrl(pathname + window.location.search));
        setState({ data: null, error, loading: false });
      });

    return () => {
      active = false;
    };
  }, [path, version, router, pathname]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
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
