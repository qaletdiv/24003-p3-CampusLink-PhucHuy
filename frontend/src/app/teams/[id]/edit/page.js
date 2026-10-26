'use client';

import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { TeamForm } from '@/components/TeamForm';
import { BackLink } from '@/components/ui/Page';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function EditTeam({ id }) {
  const { data, error } = useApi(`/teams/${id}`);
  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  if (!data.isOwner) return <ErrorState status={403} message="Only the team owner can do that." />;

  return (
    <>
      <BackLink href={`/teams/${id}`}>Back to team</BackLink>
      <div className="card mx-auto max-w-2xl">
        <p className="kicker mb-2 text-secondary!">Teams // Edit</p>
        <h1 className="mb-6 text-headline-lg font-semibold">Edit team</h1>
        <TeamForm team={data.data} />
      </div>
    </>
  );
}

export default function EditTeamPage() {
  useTitle('Edit team');
  const { id } = useParams();
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <EditTeam id={id} />
      </RequireAuth>
    </main>
  );
}
