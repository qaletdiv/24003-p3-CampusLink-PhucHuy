// Loading, error and empty states shared by every page.
import Link from 'next/link';
import { Icon } from './Icon';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 font-mono text-label-md uppercase text-on-surface-variant" role="status">
      <span className="h-2 w-2 animate-ping rounded-full bg-primary-container" aria-hidden="true" />
      {label}
    </div>
  );
}

const TITLES = { 401: 'Please log in', 403: 'Access denied', 404: 'Not found' };

export function ErrorState({ status, message }) {
  const code = status || 'ERR';
  return (
    <div className="card mx-auto max-w-xl text-center">
      <p className="font-mono text-label-md uppercase text-error">SYS // ERROR {code}</p>
      <h1 className="mt-2 text-headline-lg text-on-surface">{TITLES[status] || 'Something went wrong'}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{message}</p>
      <Link href="/" className="btn btn-primary mt-6">
        <Icon name="home" /> Back to Home
      </Link>
    </div>
  );
}

export function EmptyState({ children, action }) {
  return (
    <div className="card flex flex-col items-center gap-4 py-10 text-center text-on-surface-variant">
      <Icon name="radar" className="text-[32px]! text-outline" />
      <div className="text-body-md">{children}</div>
      {action}
    </div>
  );
}
