'use client';

import Link from 'next/link';
import { useApp } from '@/components/providers/AppProvider';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ActionButton } from '@/components/ui/ActionButton';
import { PageHeader } from '@/components/ui/Page';
import { StatusChip } from '@/components/ui/Status';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime, truncate } from '@/lib/format';
import { useApi, useTitle } from '@/lib/hooks';

function OfferList() {
  const { meta, notify } = useApp();
  const { data, error, reload } = useApi('/offers');

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  if (data.data.length === 0) {
    return (
      <EmptyState action={<Link href="/help" className="btn btn-primary">Browse help requests</Link>}>
        You haven’t offered help yet.
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-3">
      {data.data.map((offer) => (
        <li key={offer.id} className="card space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href={`/help/${offer.help_request_id}`} className="text-headline-sm font-medium hover:text-primary-container">
              {offer.request_title}
            </Link>
            <StatusChip kind="offer" status={offer.status} />
          </div>
          <p className="font-mono text-label-md text-on-surface-variant">
            Sent {formatDateTime(offer.created_at)} · you offered {meta.SUPPORT_MODES[offer.preferred_mode]} · request is{' '}
            {meta.HELP_REQUEST_STATUSES[offer.request_status]}
          </p>
          <p className="text-body-sm text-on-surface-variant">{truncate(offer.message, 200)}</p>
          {offer.status === 'pending' && (
            <ActionButton action={() => api.post(`/offers/${offer.id}/withdraw`)} confirm="Withdraw your offer?"
                          onDone={(result) => { notify(result.message); reload(); }}>
              Withdraw
            </ActionButton>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function OffersPage() {
  useTitle('My offers');
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <RequireAuth>
        <PageHeader kicker="Offers // Outgoing" title="My offers" lead="Offers you’ve sent to help other students."
                    actions={<Link href="/help" className="btn btn-ghost">Find requests to help with</Link>} />
        <OfferList />
      </RequireAuth>
    </main>
  );
}
