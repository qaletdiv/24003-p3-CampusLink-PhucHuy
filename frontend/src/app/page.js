'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { HelpRequestCard } from '@/components/cards';
import { Icon } from '@/components/ui/Icon';
import { LostFoundType } from '@/components/ui/Status';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { plural, timeAgo, truncate } from '@/lib/format';
import { useApi, useTitle } from '@/lib/hooks';

function Stat({ value, label, color }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-surface-container p-4 text-center">
      <span className={`font-headline text-headline-md font-bold ${color}`}>{value}</span>
      <span className="mt-1 font-mono text-label-sm uppercase text-on-surface-variant">{label}</span>
    </div>
  );
}

function FeedPanel({ icon, iconColor, title, href, linkLabel, children }) {
  return (
    <section className="card space-y-4 p-4!" aria-labelledby={`${href}-title`}>
      <div className="flex items-center justify-between">
        <h2 id={`${href}-title`} className="flex items-center gap-2 text-headline-sm font-medium">
          <Icon name={icon} className={`text-[20px]! ${iconColor}`} />
          {title}
        </h2>
        <Link href={href} className="font-mono text-label-sm uppercase text-primary-container hover:underline">
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  useTitle('Home');
  const router = useRouter();
  const { meta } = useApp();
  const { data, error, loading } = useApi('/home');

  function handleSearch(event) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get('q').trim();
    router.push(q ? `/help?q=${encodeURIComponent(q)}` : '/help');
  }

  return (
    <main id="main" className="container-page space-y-10 py-10">
      {/* Terminal banner */}
      <section className="card relative overflow-hidden" aria-labelledby="hero-title">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-container/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-3">
            <p className="kicker">CampusLink // Student network</p>
            <h1 id="hero-title" className="text-[32px] leading-10 font-bold tracking-tight text-primary md:text-display-lg">
              Connect with classmates, learn better together
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Post a help request, find study partners, organize group sessions and track down lost items on campus.
            </p>
          </div>
          {data && (
            <div className="grid w-full shrink-0 grid-cols-3 gap-2 lg:w-auto">
              <Stat value={data.stats.openRequests} label="Open requests" color="text-primary-container" />
              <Stat value={data.stats.teams} label="Study teams" color="text-secondary" />
              <Stat value={data.stats.openLostFound} label="Lost & found" color="text-tertiary-fixed" />
            </div>
          )}
        </div>

        <div className="relative mt-6 flex flex-col gap-4 border-t border-white/5 pt-6 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearch} role="search" className="flex flex-1 flex-col gap-2 sm:flex-row">
            <label htmlFor="quick-search" className="sr-only">Search help requests</label>
            <div className="relative flex-1">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input id="quick-search" name="q" type="search" placeholder="Search requests by title or keyword…" className="input pl-10!" />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <Link href="/help/new" className="btn btn-primary"><Icon name="add_circle" /> Post request</Link>
            <Link href="/teams/new" className="btn btn-violet"><Icon name="group_add" /> Create team</Link>
            <Link href="/lost-found/new" className="btn btn-muted" title="Post to Lost & Found">
              <Icon name="travel_explore" /> <span className="sr-only sm:not-sr-only">Lost &amp; Found</span>
            </Link>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          {Object.entries(meta.HELP_CATEGORIES).map(([value, label]) => (
            <Link key={value} href={`/help?category=${value}`} className="chip chip-cyan hover:bg-primary-container hover:text-on-primary">
              #{label.replace(/\s+/g, '')}
            </Link>
          ))}
        </div>
      </section>

      {loading && !data && <LoadingState />}
      {error && <ErrorState status={error.status} message={error.message} />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <FeedPanel icon="help_center" iconColor="text-primary-container" title="Recent requests" href="/help" linkLabel="View all">
              {data.latestRequests.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">No open help requests yet. Be the first to post one!</p>
              ) : (
                <ul className="space-y-2">
                  {data.latestRequests.slice(0, 3).map((request) => (
                    <li key={request.id} className="panel relative transition-colors hover:bg-surface-container-high">
                      <div className="mb-1 flex justify-between font-mono text-label-sm uppercase text-on-surface-variant">
                        <span className="text-primary-container">{meta.HELP_CATEGORIES[request.category]}</span>
                        <span>{timeAgo(request.created_at)}</span>
                      </div>
                      <Link href={`/help/${request.id}`} className="line-clamp-1 text-body-md font-semibold after:absolute after:inset-0">
                        {request.title}
                      </Link>
                      <p className="mt-1 flex items-center gap-1 font-mono text-label-sm text-on-surface-variant">
                        <Icon name={request.support_mode === 'online' ? 'videocam' : 'pin_drop'} className="text-[14px]!" />
                        {request.location_label || meta.SUPPORT_MODES[request.support_mode]}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </FeedPanel>

            <FeedPanel icon="hub" iconColor="text-secondary" title="Study teams" href="/teams" linkLabel="All teams">
              {data.featuredTeams.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  No teams yet. <Link href="/teams/new" className="text-secondary underline">Create the first one!</Link>
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.featuredTeams.map((team) => (
                    <li key={team.id} className="panel relative transition-colors hover:bg-surface-container-high">
                      <div className="mb-1 flex justify-between font-mono text-label-sm uppercase">
                        <span className="text-secondary">{plural(team.member_count, 'member')}</span>
                        {team.upcoming_count > 0 && <span className="text-on-surface-variant">{plural(team.upcoming_count, 'session')}</span>}
                      </div>
                      <Link href={`/teams/${team.id}`} className="text-body-md font-semibold after:absolute after:inset-0">
                        {team.name}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-body-sm text-on-surface-variant">{truncate(team.description, 90)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </FeedPanel>

            <FeedPanel icon="travel_explore" iconColor="text-tertiary-fixed" title="Lost & Found" href="/lost-found" linkLabel="Feed">
              {data.latestLostFound.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">No open posts right now.</p>
              ) : (
                <ul className="space-y-2">
                  {data.latestLostFound.map((post) => (
                    <li key={post.id} className="panel relative flex items-start gap-3 transition-colors hover:bg-surface-container-high">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <LostFoundType type={post.post_type} />
                          <span className="font-mono text-label-sm text-on-surface-variant">{timeAgo(post.created_at)}</span>
                        </div>
                        <Link href={`/lost-found/${post.id}`} className="mt-1 block truncate text-body-md font-semibold after:absolute after:inset-0">
                          {post.title}
                        </Link>
                        <span className="font-mono text-label-sm text-on-surface-variant">{post.location_label}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </FeedPanel>
          </div>

          {data.latestRequests.length > 0 && (
            <section className="space-y-4" aria-labelledby="latest-title">
              <div className="divider-glow" />
              <div className="flex items-end justify-between">
                <div>
                  <p className="kicker mb-1">Help // Open requests</p>
                  <h2 id="latest-title" className="text-headline-md font-semibold">Latest help requests</h2>
                </div>
                <Link href="/help" className="font-mono text-label-md text-primary-container hover:underline">View all →</Link>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {data.latestRequests.map((request) => (
                  <HelpRequestCard key={request.id} request={request} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
