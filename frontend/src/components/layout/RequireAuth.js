'use client';

// Route guards. These only decide what to show: the API checks permissions again on every request.
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { LoadingState } from '@/components/ui/States';
import { loginUrl } from '@/lib/safeRedirect';

// Only logged-in users see the children. Guests are sent to Login and brought back afterwards.
export function RequireAuth({ children }) {
  const { user, notify } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user) return;
    notify('Please log in to continue.', 'info', '/login');
    router.replace(loginUrl(pathname + window.location.search));
  }, [user, router, pathname, notify]);

  return user ? children : <LoadingState label="Redirecting to login…" />;
}

// Login/Register are for guests only; users who were already logged in when they opened it go to Home.
// (Someone who logs in on this page is sent on by the form itself, e.g. back to returnTo.)
export function GuestOnly({ children }) {
  const { user } = useApp();
  const router = useRouter();
  const [loggedInOnArrival] = useState(Boolean(user));

  useEffect(() => {
    if (loggedInOnArrival) router.replace('/');
  }, [loggedInOnArrival, router]);

  return loggedInOnArrival ? <LoadingState /> : children;
}
