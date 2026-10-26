'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/providers/AppProvider';
import { Icon } from '@/components/ui/Icon';
import { initials } from '@/lib/format';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/help', label: 'Find Help' },
  { href: '/teams', label: 'Study Teams' },
  { href: '/lost-found', label: 'Lost & Found' },
];

const ACCOUNT_LINKS = [
  { href: '/offers', label: 'My offers' },
  { href: '/sessions', label: 'Sessions' },
];

export function Header() {
  const { user, logout, notify } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setOpen(false), [pathname]); // close the phone menu after navigating

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const linkClass = (href) =>
    `rounded-md px-3 py-2 font-mono text-label-md transition-colors ${
      isActive(href)
        ? 'bg-primary-container font-semibold text-on-primary'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/');
      notify('You have been logged out.', 'info', '/');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-surface-container-lowest/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary-container shadow-[0_0_12px_rgba(0,240,255,0.8)]" aria-hidden="true" />
          <span className="font-headline text-headline-sm font-bold uppercase tracking-tight text-primary">CampusLink</span>
        </Link>

        <button
          type="button"
          className="btn btn-muted px-3 lg:hidden"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? 'close' : 'menu'} />
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav
          id="site-nav"
          aria-label="Main navigation"
          className={`${open ? 'flex' : 'hidden'} absolute inset-x-0 top-16 flex-col gap-4 border-b border-white/5 bg-surface-container-lowest p-4 lg:static lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:border-0 lg:bg-transparent lg:p-0`}
        >
          <ul className="flex flex-col gap-1 lg:flex-row lg:pl-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`block ${linkClass(link.href)}`} aria-current={isActive(link.href) ? 'page' : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <>
                {ACCOUNT_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                    {link.label}
                  </Link>
                ))}
                <Link href="/account" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface-container-high" title="My Account">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-mono text-label-md font-bold text-on-primary shadow-glow">
                    {initials(user.fullName)}
                  </span>
                  <span className="text-body-sm text-on-surface">{user.fullName}</span>
                </Link>
                <button type="button" onClick={handleLogout} disabled={loggingOut} className={`btn btn-ghost ${loggingOut ? 'is-busy' : ''}`}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Log in</Link>
                <Link href="/register" className="btn btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
