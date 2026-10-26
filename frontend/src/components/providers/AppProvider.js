'use client';

// App-wide state shared by every page:
//  - auth:  the logged-in user (or null), refreshed from GET /api/auth/me
//  - meta:  categories, statuses, ... with their labels, from GET /api/meta
//  - flash: one-time messages shown after an action ("Your request was posted.")
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api, setCsrfToken } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/ui/States';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [meta, setMeta] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [flash, setFlash] = useState(null); // { type, message, path }

  const refreshUser = useCallback(async () => {
    const result = await api.get('/auth/me');
    setCsrfToken(result.csrfToken);
    setUser(result.user);
    return result.user;
  }, []);

  useEffect(() => {
    Promise.all([refreshUser(), api.get('/meta').then(setMeta)]).catch((err) => setBootError(err));
  }, [refreshUser]);

  // A flash message belongs to one page: it disappears once the user goes somewhere else.
  useEffect(() => {
    setFlash((current) => (current && current.path !== pathname ? null : current));
  }, [pathname]);

  const notify = useCallback(
    (message, type = 'success', path = window.location.pathname) => setFlash({ message, type, path }),
    []
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
      refreshUser,
      login(result) {
        setCsrfToken(result.csrfToken);
        setUser(result.user);
      },
      async logout() {
        await api.post('/auth/logout');
        await refreshUser(); // new guest session with a fresh CSRF token
      },
      meta,
      flash,
      notify,
      clearFlash: () => setFlash(null),
    }),
    [user, refreshUser, meta, flash, notify]
  );

  if (bootError) {
    return (
      <main id="main" className="container-page py-16">
        <ErrorState
          status={bootError.status}
          message="CampusLink can’t reach its API right now. Make sure the backend is running, then refresh."
        />
      </main>
    );
  }
  if (user === undefined || !meta) {
    return (
      <main id="main" className="container-page py-16">
        <LoadingState />
      </main>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
