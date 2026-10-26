'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { HelpRequestCard } from '@/components/cards';
import { FilterBar, FilterSelect } from '@/components/FilterBar';
import { Options } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/Page';
import { Pagination, ResultCount } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function HelpList() {
  const { meta } = useApp();
  const searchParams = useSearchParams();
  const { data, error } = useApi(`/help-requests?${searchParams}`);

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;

  const { filters, hasActiveFilters, pagination } = data;
  return (
    <>
      <FilterBar label="Search and filter help requests" filters={filters} hasActiveFilters={hasActiveFilters}
                 keywordPlaceholder="Title or description…">
        <FilterSelect name="category" label="Category" value={filters.category}>
          <Options map={meta.HELP_CATEGORIES} placeholder="All categories" />
        </FilterSelect>
        <FilterSelect name="mode" label="Support type" value={filters.mode}>
          <Options map={meta.SUPPORT_MODES} placeholder="Any" />
        </FilterSelect>
        <FilterSelect name="status" label="Status" value={filters.status}>
          <Options map={meta.HELP_REQUEST_STATUSES} />
          <option value="all">All statuses</option>
        </FilterSelect>
        <FilterSelect name="sort" label="Sort by" value={filters.sort}>
          <Options map={meta.HELP_SORT_OPTIONS} />
        </FilterSelect>
      </FilterBar>

      {pagination.total === 0 ? (
        <EmptyState action={hasActiveFilters && <Link href="/help" className="btn btn-muted">Clear filters</Link>}>
          No help requests match your search.
        </EmptyState>
      ) : (
        <>
          <ResultCount pagination={pagination} noun="request" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {data.data.map((request) => (
              <HelpRequestCard key={request.id} request={request} headingLevel="h2" />
            ))}
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} />
        </>
      )}
    </>
  );
}

export default function HelpListPage() {
  useTitle('Find Help');
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <PageHeader
        kicker="Help // Peer assistance"
        title="Find Help"
        lead="Browse requests from other students and offer help where you can."
        actions={<Link href="/help/new" className="btn btn-primary"><Icon name="add_circle" /> Post a help request</Link>}
      />
      <Suspense fallback={<LoadingState />}>
        <HelpList />
      </Suspense>
    </main>
  );
}
