'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ActionButton } from '@/components/ui/ActionButton';
import { Icon } from '@/components/ui/Icon';
import { BackLink, DetailList, Section } from '@/components/ui/Page';
import { Chip } from '@/components/ui/Status';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useApi, useTitle } from '@/lib/hooks';

function TeamSessionDetail({ id, sessionId }) {
  const { notify } = useApp();
  const { data, error, reload } = useApi(`/teams/${id}/sessions/${sessionId}`);
  useTitle(data ? data.data.title : 'Team session');

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;

  const { data: session, team, canManage } = data;
  const status = session.status === 'cancelled'
    ? { label: 'Cancelled', color: 'chip-red' }
    : session.is_past ? { label: 'Past', color: '' } : { label: 'Upcoming', color: 'chip-green' };

  return (
    <>
      <BackLink href={`/teams/${team.id}`}>Back to {team.name}</BackLink>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <article className="card space-y-4 lg:col-span-7">
          <div className="flex flex-wrap gap-1.5">
            <Chip color={status.color}>{status.label}</Chip>
            <Chip color="chip-violet">{team.name}</Chip>
          </div>
          <h1 className="text-headline-lg font-semibold">{session.title}</h1>
          <p className="font-mono text-label-md text-on-surface-variant">
            Created by {session.creator_name} · {formatDateTime(session.created_at)}
          </p>
          {session.description ? (
            <p className="whitespace-pre-line text-body-md text-on-surface-variant">{session.description}</p>
          ) : (
            <p className="text-body-sm text-outline">No description.</p>
          )}
        </article>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <Section title="When & where" icon={<Icon name="event" className="text-secondary" />}>
            <DetailList items={[
              ['Starts', formatDateTime(session.starts_at)],
              ['Ends', formatDateTime(session.ends_at)],
              ['Where', session.location_label || 'Not set'],
            ]} />
          </Section>

          {canManage && (
            <Section title="Your session" icon={<Icon name="tune" className="text-primary-container" />}>
              <div className="space-y-3">
                <Link href={`/teams/${team.id}/sessions/${session.id}/edit`} className="btn btn-primary btn-block">Edit session</Link>
                <ActionButton block className="btn-danger" action={() => api.post(`/teams/${team.id}/sessions/${session.id}/cancel`)}
                              confirm="Cancel this session? Team members will see it as cancelled."
                              onDone={(result) => { notify(result.message); reload(); }}>
                  Cancel session
                </ActionButton>
              </div>
            </Section>
          )}
        </aside>
      </div>
    </>
  );
}

export default function TeamSessionPage() {
  const { id, sessionId } = useParams();
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <TeamSessionDetail id={id} sessionId={sessionId} />
      </RequireAuth>
    </main>
  );
}
