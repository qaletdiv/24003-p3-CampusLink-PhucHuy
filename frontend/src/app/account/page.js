'use client';

import Link from 'next/link';
import { useApp } from '@/components/providers/AppProvider';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { Icon } from '@/components/ui/Icon';
import { DetailList, PageHeader, Section } from '@/components/ui/Page';
import { Chip, LostFoundType, StatusChip } from '@/components/ui/Status';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { formatDateTime, plural } from '@/lib/format';
import { useApi, useTitle } from '@/lib/hooks';

// "Showing 5 of 12" note for sections that only list the most recent items
function MoreNote({ shown, total }) {
  return total > shown ? <p className="field-hint">Showing the {shown} most recent of {total}.</p> : null;
}

function Row({ href, title, chips, meta: metaText }) {
  return (
    <li className="panel relative hover:bg-surface-container-high">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={href} className="text-body-sm font-semibold after:absolute after:inset-0">{title}</Link>
        <div className="flex gap-1.5">{chips}</div>
      </div>
      <p className="mt-1 font-mono text-label-sm text-on-surface-variant">{metaText}</p>
    </li>
  );
}

function Account() {
  const { meta, user } = useApp();
  const { data, error } = useApi('/account');

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;

  const { profile, requests, requestCount, offers, offerCount, sessions, sessionCount, teams, posts, postCount } = data;
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <Section title={`My help requests (${requestCount})`} icon={<Icon name="help_center" className="text-primary-container" />}
                 actions={<Link href="/help/new" className="btn btn-ghost"><Icon name="add" /> New request</Link>}>
          {requests.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">You haven’t asked for help yet.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((request) => (
                <Row key={request.id} href={`/help/${request.id}`} title={request.title}
                     chips={<StatusChip kind="help" status={request.status} />}
                     meta={`${meta.HELP_CATEGORIES[request.category]} · ${meta.SUPPORT_MODES[request.support_mode]} · posted ${formatDateTime(request.created_at)}`} />
              ))}
            </ul>
          )}
          <MoreNote shown={requests.length} total={requestCount} />
        </Section>

        <Section title={`My offers (${offerCount})`} icon={<Icon name="send" className="text-secondary" />}
                 actions={offerCount > 0 && <Link href="/offers" className="font-mono text-label-md text-primary-container hover:underline">See all →</Link>}>
          {offers.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              You haven’t offered help yet. <Link href="/help" className="text-primary-container underline">Browse requests</Link>.
            </p>
          ) : (
            <ul className="space-y-2">
              {offers.map((offer) => (
                <Row key={offer.id} href={`/help/${offer.help_request_id}`} title={offer.request_title}
                     chips={<StatusChip kind="offer" status={offer.status} />} meta={`Sent ${formatDateTime(offer.created_at)}`} />
              ))}
            </ul>
          )}
        </Section>

        <Section title={`My help sessions (${sessionCount})`} icon={<Icon name="handshake" className="text-tertiary-fixed" />}
                 actions={sessionCount > 0 && <Link href="/sessions" className="font-mono text-label-md text-primary-container hover:underline">See all →</Link>}>
          {sessions.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No help sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <Row key={session.id} href={`/sessions/${session.id}`} title={session.request_title}
                     chips={<StatusChip kind="session" status={session.status} />}
                     meta={session.helper_user_id === user.id ? `Helping ${session.requester_name}` : `Helped by ${session.helper_name}`} />
              ))}
            </ul>
          )}
        </Section>

        <Section title={`My Lost & Found posts (${postCount})`} icon={<Icon name="travel_explore" className="text-tertiary-fixed" />}
                 actions={<Link href="/lost-found/new" className="btn btn-ghost"><Icon name="add" /> New post</Link>}>
          {posts.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">You haven’t posted anything.</p>
          ) : (
            <ul className="space-y-2">
              {posts.map((post) => (
                <Row key={post.id} href={`/lost-found/${post.id}`} title={post.title}
                     chips={<><LostFoundType type={post.post_type} /><StatusChip kind="lostFound" status={post.status} /></>}
                     meta={`Posted ${formatDateTime(post.created_at)}`} />
              ))}
            </ul>
          )}
          <MoreNote shown={posts.length} total={postCount} />
        </Section>
      </div>

      <aside className="flex flex-col gap-6 lg:col-span-5">
        <Section title="Profile" icon={<Icon name="person" className="text-primary-container" />}>
          <DetailList items={[
            ['Full name', profile.full_name],
            ['Email', profile.email],
            ['Major', profile.major || 'Not set'],
            ['Member since', formatDateTime(profile.created_at)],
          ]} />
          <p className="field-hint">Your email is private. It’s only shown to the other person in a help session.</p>
          <Link href="/account/edit" className="btn btn-primary btn-block">Edit profile</Link>
        </Section>

        <Section title={`My teams (${teams.length})`} icon={<Icon name="hub" className="text-secondary" />}>
          {teams.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              You haven’t joined a team. <Link href="/teams" className="text-primary-container underline">Find one</Link>.
            </p>
          ) : (
            <ul className="space-y-2">
              {teams.map((team) => (
                <Row key={team.id} href={`/teams/${team.id}`} title={team.name}
                     chips={team.owner_user_id === user.id && <Chip color="chip-violet">Owner</Chip>}
                     meta={plural(team.member_count, 'member')} />
              ))}
            </ul>
          )}
        </Section>
      </aside>
    </div>
  );
}

export default function AccountPage() {
  useTitle('My Account');
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <RequireAuth>
        <PageHeader kicker="Account // Profile" title="My Account" lead="Your profile and everything you’ve done on CampusLink." />
        <Account />
      </RequireAuth>
    </main>
  );
}
