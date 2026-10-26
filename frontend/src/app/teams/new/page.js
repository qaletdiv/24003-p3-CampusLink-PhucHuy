'use client';

import { RequireAuth } from '@/components/layout/RequireAuth';
import { TeamForm } from '@/components/TeamForm';
import { BackLink } from '@/components/ui/Page';
import { useTitle } from '@/lib/hooks';

export default function NewTeamPage() {
  useTitle('Create a team');
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <BackLink href="/teams">Back to teams</BackLink>
        <div className="card mx-auto max-w-2xl">
          <p className="kicker mb-2 text-secondary!">Teams // New cohort</p>
          <h1 className="text-headline-lg font-semibold">Create a team</h1>
          <p className="mb-6 mt-1 text-body-sm text-on-surface-variant">You’ll be the team owner and its first member.</p>
          <TeamForm />
        </div>
      </RequireAuth>
    </main>
  );
}
