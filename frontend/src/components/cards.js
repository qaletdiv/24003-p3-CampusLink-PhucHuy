'use client';

// List cards for help requests, teams and Lost & Found posts.
import Link from 'next/link';
import { useApp } from '@/components/providers/AppProvider';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Page';
import { LostFoundType, StatusChip } from '@/components/ui/Status';
import { formatDateTime, initials, plural, timeAgo, truncate } from '@/lib/format';

export function HelpRequestCard({ request, headingLevel: Heading = 'h3' }) {
  const { meta } = useApp();
  return (
    <article className="card card-interactive group relative flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip chip-solid-cyan">{meta.HELP_CATEGORIES[request.category]}</span>
            <span className="chip">{meta.SUPPORT_MODES[request.support_mode]}</span>
            <StatusChip kind="help" status={request.status} />
          </div>
          <span className="font-mono text-label-sm text-on-surface-variant">{timeAgo(request.created_at)}</span>
        </div>
        <Heading className="text-headline-sm font-medium text-on-surface transition-colors group-hover:text-primary-container">
          <Link href={`/help/${request.id}`} className="after:absolute after:inset-0">
            {request.title}
          </Link>
        </Heading>
        <p className="text-body-sm text-on-surface-variant">{truncate(request.description, 140)}</p>
        <div className="grid grid-cols-1 gap-2 font-mono text-label-md text-on-surface sm:grid-cols-2">
          <span className="flex items-center gap-1.5">
            <Icon name={request.support_mode === 'online' ? 'videocam' : 'location_on'} className="text-primary-container" />
            {request.location_label || meta.SUPPORT_MODES[request.support_mode]}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="schedule" className="text-secondary" />
            {request.scheduled_at ? formatDateTime(request.scheduled_at) : 'Time not set'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-white/5 pt-3">
        <Avatar text={initials(request.author_name)} />
        <span className="text-body-sm text-on-surface">{request.author_name}</span>
      </div>
    </article>
  );
}

export function TeamCard({ team, isMember, headingLevel: Heading = 'h3' }) {
  return (
    <article className="card card-interactive group relative flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip chip-violet">{plural(team.member_count, 'member')}</span>
        {team.upcoming_count > 0 && (
          <span className="chip chip-cyan">{plural(team.upcoming_count, 'upcoming session')}</span>
        )}
        {isMember && <span className="chip chip-green">Member</span>}
      </div>
      <Heading className="text-headline-sm font-medium text-on-surface transition-colors group-hover:text-secondary">
        <Link href={`/teams/${team.id}`} className="after:absolute after:inset-0">
          {team.name}
        </Link>
      </Heading>
      <p className="text-body-sm text-on-surface-variant">{truncate(team.description, 120)}</p>
      <p className="mt-auto font-mono text-label-md text-on-surface-variant">
        Owner: <span className="text-on-surface">{team.owner_name}</span>
      </p>
    </article>
  );
}

export function LostFoundCard({ post, headingLevel: Heading = 'h3' }) {
  const { meta } = useApp();
  return (
    <article className="card card-interactive group relative flex gap-4">
      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-supplied link from any host
        <img
          src={post.image_url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-16 w-16 shrink-0 rounded-md bg-surface-container-highest object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-surface-container-highest text-outline">
          <Icon name={post.post_type === 'lost' ? 'search' : 'inventory_2'} className="text-[28px]!" />
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <LostFoundType type={post.post_type} />
          <span className="chip">{meta.LOST_FOUND_CATEGORIES[post.category]}</span>
          <StatusChip kind="lostFound" status={post.status} />
        </div>
        <Heading className="truncate text-body-md font-semibold text-on-surface transition-colors group-hover:text-primary-container">
          <Link href={`/lost-found/${post.id}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </Heading>
        <p className="flex items-center gap-1 font-mono text-label-md text-on-surface-variant">
          <Icon name="pin_drop" className="text-[14px]!" /> {post.location_label} · {timeAgo(post.created_at)}
        </p>
      </div>
    </article>
  );
}
