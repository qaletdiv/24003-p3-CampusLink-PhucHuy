'use client';

import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { TeamSessionForm } from '@/components/TeamSessionForm';
import { BackLink } from '@/components/ui/Page';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function EditSession({ id, sessionId }) {
  const { data, error } = useApi(`/teams/${id}/sessions/${sessionId}`);
  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  if (!data.canManage) {
    return <ErrorState status={403} message="Only the person who created this session can change it, and only before it ends." />;
  }

  return (
    <>
      <BackLink href={`/teams/${id}/sessions/${sessionId}`}>Back to session</BackLink>
      <div className="card mx-auto max-w-2xl">
        <p className="kicker mb-2">Teams // Edit session</p>
        <h1 className="mb-6 text-headline-lg font-semibold">Edit session</h1>
        <TeamSessionForm team={data.team} session={data.data} />
      </div>
    </>
  );
}

export default function EditTeamSessionPage() {
  useTitle('Edit session');
  const { id, sessionId } = useParams();
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <EditSession id={id} sessionId={sessionId} />
      </RequireAuth>
    </main>
  );
}
