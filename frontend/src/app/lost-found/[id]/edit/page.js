'use client';

import { useParams } from 'next/navigation';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LostFoundForm } from '@/components/LostFoundForm';
import { BackLink } from '@/components/ui/Page';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useApi, useTitle } from '@/lib/hooks';

function EditPost({ id }) {
  const { data, error } = useApi(`/lost-found/${id}`);
  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  if (!data.isOwner) return <ErrorState status={403} message="You can only manage your own posts." />;
  if (data.data.status !== 'open') return <ErrorState status={409} message="Reopen the post before editing it." />;

  return (
    <>
      <BackLink href={`/lost-found/${id}`}>Back to post</BackLink>
      <div className="card mx-auto max-w-3xl">
        <p className="kicker mb-2 text-tertiary-fixed!">Lost &amp; Found // Edit</p>
        <h1 className="mb-6 text-headline-lg font-semibold">Edit post</h1>
        <LostFoundForm post={data.data} />
      </div>
    </>
  );
}

export default function EditLostFoundPage() {
  useTitle('Edit post');
  const { id } = useParams();
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <EditPost id={id} />
      </RequireAuth>
    </main>
  );
}
