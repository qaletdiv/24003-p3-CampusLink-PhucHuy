'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LostFoundForm } from '@/components/LostFoundForm';
import { BackLink } from '@/components/ui/Page';
import { useTitle } from '@/lib/hooks';

function NewPostForm() {
  const type = useSearchParams().get('type');
  return <LostFoundForm postType={['lost', 'found'].includes(type) ? type : ''} />;
}

export default function NewLostFoundPage() {
  useTitle('Post to Lost & Found');
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <BackLink href="/lost-found">Back to Lost &amp; Found</BackLink>
        <div className="card mx-auto max-w-3xl">
          <p className="kicker mb-2 text-tertiary-fixed!">Lost &amp; Found // New post</p>
          <h1 className="text-headline-lg font-semibold">Post to Lost &amp; Found</h1>
          <p className="mb-6 mt-2 rounded-md bg-surface-container p-3 text-body-sm text-on-surface-variant">
            Don’t post ID numbers, home addresses or anyone else’s personal details. For found cards and documents,
            describe them only in general terms.
          </p>
          <Suspense>
            <NewPostForm />
          </Suspense>
        </div>
      </RequireAuth>
    </main>
  );
}
