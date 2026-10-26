'use client';

// Search + filter bar for list pages. The URL query string is the source of truth:
// submitting turns the form into ?q=...&category=... (empty values left out).
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

export function FilterBar({ label, filters, hasActiveFilters, keywordPlaceholder, children }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    // key: reset the inputs whenever the applied filters change (e.g. "Clear filters", Back button)
    <form key={JSON.stringify(filters)} onSubmit={handleSubmit} role="search" aria-label={label}
          className="card grid grid-cols-1 gap-4 p-4! sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      <div className="sm:col-span-2">
        <label htmlFor="filter-q" className="field-label">Keyword</label>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input id="filter-q" name="q" type="search" maxLength={100} defaultValue={filters.q}
                 placeholder={keywordPlaceholder} className="input pl-10!" />
        </div>
      </div>
      {children}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
        <button type="submit" className="btn btn-primary">Apply</button>
        {hasActiveFilters && <Link href={pathname} className="btn btn-muted">Clear filters</Link>}
      </div>
    </form>
  );
}

// One <select> filter.
export function FilterSelect({ name, label, value, children }) {
  return (
    <div>
      <label htmlFor={`filter-${name}`} className="field-label">{label}</label>
      <select id={`filter-${name}`} name={name} defaultValue={value} className="input">
        {children}
      </select>
    </div>
  );
}
