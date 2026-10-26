'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { LostFoundCard } from '@/components/cards';
import { FilterBar, FilterSelect } from '@/components/FilterBar';
import { Options } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/Page';
import { Pagination, ResultCount } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function PostList() {
  const { meta } = useApp();
  const searchParams = useSearchParams();
  const { data, error } = useApi(`/lost-found?${searchParams}`);

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;

  const { filters, hasActiveFilters, pagination } = data;
  return (
    <>
      <FilterBar label="Search and filter Lost & Found posts" filters={filters} hasActiveFilters={hasActiveFilters}
                 keywordPlaceholder="Item, description or place…">
        <FilterSelect name="type" label="Type" value={filters.type}>
          <Options map={meta.LOST_FOUND_TYPES} placeholder="Lost and found" />
        </FilterSelect>
        <FilterSelect name="category" label="Category" value={filters.category}>
          <Options map={meta.LOST_FOUND_CATEGORIES} placeholder="All categories" />
        </FilterSelect>
        <FilterSelect name="posted" label="Posted" value={filters.posted}>
          <Options map={meta.LOST_FOUND_POSTED_WITHIN} placeholder="Any time" />
        </FilterSelect>
        <FilterSelect name="status" label="Status" value={filters.status}>
          <Options map={meta.LOST_FOUND_STATUSES} />
          <option value="all">All statuses</option>
        </FilterSelect>
      </FilterBar>

      {pagination.total === 0 ? (
        <EmptyState action={hasActiveFilters && <Link href="/lost-found" className="btn btn-muted">Clear filters</Link>}>
          No posts match your search.
        </EmptyState>
      ) : (
        <>
          <ResultCount pagination={pagination} noun="post" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.data.map((post) => <LostFoundCard key={post.id} post={post} headingLevel="h2" />)}
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} />
        </>
      )}
    </>
  );
}

export default function LostFoundPage() {
  useTitle('Lost & Found');
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <PageHeader
        kicker="Lost & Found // Campus feed"
        title="Lost & Found"
        lead="Lost something on campus, or found something that isn’t yours?"
        actions={
          <>
            <Link href="/lost-found/new?type=lost" className="btn btn-primary"><Icon name="search" /> I lost something</Link>
            <Link href="/lost-found/new?type=found" className="btn btn-ghost"><Icon name="inventory_2" /> I found something</Link>
          </>
        }
      />
      <Suspense fallback={<LoadingState />}>
        <PostList />
      </Suspense>
    </main>
  );
}
