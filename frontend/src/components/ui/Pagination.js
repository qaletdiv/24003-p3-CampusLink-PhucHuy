'use client';

// Pagination bar. Keeps the current filters in the URL and only changes ?page=.
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { buildPageList } from '@/lib/pagination';

export function Pagination({ page, totalPages }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  const pageUrl = (n) => {
    const params = new URLSearchParams(searchParams);
    if (n > 1) params.set('page', n);
    else params.delete('page');
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const cell = 'flex h-9 min-w-9 items-center justify-center rounded px-2 font-mono text-label-md';
  return (
    <nav aria-label="Pagination" className="card flex flex-wrap items-center justify-center gap-2 p-3!">
      {page > 1 ? (
        <Link href={pageUrl(page - 1)} rel="prev" className={`${cell} bg-surface-container hover:text-primary-container`}>
          « Prev
        </Link>
      ) : (
        <span className={`${cell} text-outline`} aria-hidden="true">« Prev</span>
      )}
      <ul className="flex items-center gap-1">
        {buildPageList(page, totalPages).map((item, index) => (
          <li key={`${item}-${index}`}>
            {item === '…' ? (
              <span className={`${cell} text-outline`} aria-hidden="true">…</span>
            ) : item === page ? (
              <span className={`${cell} bg-primary-container font-bold text-on-primary`} aria-current="page">
                <span className="sr-only">Page </span>{item}
              </span>
            ) : (
              <Link href={pageUrl(item)} className={`${cell} bg-surface-container hover:text-primary-container`}>
                <span className="sr-only">Page </span>{item}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {page < totalPages ? (
        <Link href={pageUrl(page + 1)} rel="next" className={`${cell} bg-surface-container hover:text-primary-container`}>
          Next »
        </Link>
      ) : (
        <span className={`${cell} text-outline`} aria-hidden="true">Next »</span>
      )}
    </nav>
  );
}

export function ResultCount({ pagination, noun }) {
  const { page, pageSize, total } = pagination;
  return (
    <p className="font-mono text-label-md text-on-surface-variant" aria-live="polite">
      Showing <span className="text-on-surface">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</span> of{' '}
      <span className="text-primary-container">{total}</span> {noun}
      {total === 1 ? '' : 's'}
    </p>
  );
}
