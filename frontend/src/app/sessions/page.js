'use client';

import Link from 'next/link';
import { useApp } from '@/components/providers/AppProvider';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/Page';
import { StatusChip } from '@/components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { formatDateTime } from '@/lib/format';
import { useApi, useTitle } from '@/lib/hooks';

function SessionList() {
  const { meta, user } = useApp();
  const { data, error } = useApi('/sessions');

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  if (data.data.length === 0) {
    return <EmptyState>No help sessions yet. A session starts when a request owner accepts an offer.</EmptyState>;
  }

  return (
    <ul className="space-y-3">
      {data.data.map((session) => {
        const iAmHelper = session.helper_user_id === user.id;
        const needsAnswer = session.proposed_by_user_id && session.proposed_by_user_id !== user.id;
        return (
          <li key={session.id} className="card card-interactive relative space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/sessions/${session.id}`} className="text-headline-sm font-medium after:absolute after:inset-0">
                {session.request_title}
              </Link>
              <StatusChip kind="session" status={session.status} />
            </div>
            {needsAnswer && (
              <p className="flex items-center gap-1 font-mono text-label-md text-warning">
                <Icon name="notifications_active" /> New details proposed – waiting for your answer
              </p>
            )}
            <p className="font-mono text-label-md text-on-surface-variant">
              {iAmHelper ? `You’re helping ${session.requester_name}` : `${session.helper_name} is helping you`}
              {' · '}{meta.SUPPORT_MODES[session.mode]}
              {' · '}{session.scheduled_at ? formatDateTime(session.scheduled_at) : 'Time not set'}
              {session.location_label && ` · ${session.location_label}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export default function SessionsPage() {
  useTitle('My help sessions');
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <RequireAuth>
        <PageHeader kicker="Sessions // One-to-one" title="My help sessions" lead="Sessions where you’re getting help or helping someone." />
        <SessionList />
      </RequireAuth>
    </main>
  );
}
