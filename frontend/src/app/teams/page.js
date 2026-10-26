'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TeamCard } from '@/components/cards';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/Page';
import { Pagination, ResultCount } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function TeamList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, error } = useApi(`/teams?${searchParams}`);

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;

  const { q } = data.filters;
  const myTeamIds = new Set(data.myTeamIds);

  function handleSearch(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q').trim();
    router.push(value ? `${pathname}?q=${encodeURIComponent(value)}` : pathname);
  }

  return (
    <>
      <form key={q} onSubmit={handleSearch} role="search" className="card flex flex-col gap-2 p-4! sm:flex-row">
        <label htmlFor="team-search" className="sr-only">Search teams</label>
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input id="team-search" name="q" type="search" defaultValue={q} maxLength={100}
                 placeholder="Search by name or description…" className="input pl-10!" />
        </div>
        <button type="submit" className="btn btn-violet">Search</button>
        {q && <Link href="/teams" className="btn btn-muted">Clear</Link>}
      </form>

      {data.pagination.total === 0 ? (
        <EmptyState action={q && <Link href="/teams" className="btn btn-muted">Show all teams</Link>}>
          {q ? 'No teams match your search.' : 'No teams yet. Be the first to create one!'}
        </EmptyState>
      ) : (
        <>
          <ResultCount pagination={data.pagination} noun="team" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.data.map((team) => (
              <TeamCard key={team.id} team={team} isMember={myTeamIds.has(team.id)} headingLevel="h2" />
            ))}
          </div>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} />
        </>
      )}
    </>
  );
}

export default function TeamsPage() {
  useTitle('Study Teams');
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <PageHeader
        kicker="Teams // Study cohorts"
        title="Study Teams"
        lead="Find a group to study with, or start your own. All teams are open to join."
        actions={<Link href="/teams/new" className="btn btn-violet"><Icon name="group_add" /> Create a team</Link>}
      />
      <Suspense fallback={<LoadingState />}>
        <TeamList />
      </Suspense>
    </main>
  );
}
