'use client';

import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { TeamSessionForm } from '@/components/TeamSessionForm';
import { BackLink } from '@/components/ui/Page';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function NewSession({ id }) {
  const { data, error } = useApi(`/teams/${id}`);
  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  if (!data.isMember) return <ErrorState status={403} message="Only members of this team can do that. Join the team first." />;

  const team = data.data;
  return (
    <>
      <BackLink href={`/teams/${team.id}`}>Back to {team.name}</BackLink>
      <div className="card mx-auto max-w-2xl">
        <p className="kicker mb-2">Teams // New session</p>
        <h1 className="text-headline-lg font-semibold">New session or event</h1>
        <p className="mb-6 mt-1 text-body-sm text-on-surface-variant">
          For <strong className="text-on-surface">{team.name}</strong>. Only team members can see it.
        </p>
        <TeamSessionForm team={team} />
      </div>
    </>
  );
}

export default function NewTeamSessionPage() {
  useTitle('New session or event');
  const { id } = useParams();
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <NewSession id={id} />
      </RequireAuth>
    </main>
  );
}
