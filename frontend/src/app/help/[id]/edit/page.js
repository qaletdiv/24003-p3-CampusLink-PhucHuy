'use client';

import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { HelpRequestForm } from '@/components/HelpRequestForm';
import { BackLink } from '@/components/ui/Page';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function EditForm({ id }) {
  const { data, error } = useApi(`/help-requests/${id}`);

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  if (!data.isOwner) return <ErrorState status={403} message="You can only manage your own help requests." />;
  if (data.data.status !== 'open') return <ErrorState status={409} message="Only open requests can be edited." />;

  return (
    <>
      <BackLink href={`/help/${id}`}>Back to request</BackLink>
      <div className="card mx-auto max-w-3xl">
        <p className="kicker mb-2">Help // Edit request</p>
        <h1 className="mb-6 text-headline-lg font-semibold">Edit help request</h1>
        <HelpRequestForm request={data.data} />
      </div>
    </>
  );
}

export default function EditHelpRequestPage() {
  useTitle('Edit help request');
  const { id } = useParams();
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <EditForm id={id} />
      </RequireAuth>
    </main>
  );
}
