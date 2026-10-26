'use client';

import { RequireAuth } from '@/components/layout/RequireAuth';
import { HelpRequestForm } from '@/components/HelpRequestForm';
import { BackLink } from '@/components/ui/Page';
import { useTitle } from '@/lib/hooks';

export default function NewHelpRequestPage() {
  useTitle('Post a help request');
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <BackLink href="/help">Back to help requests</BackLink>
        <div className="card mx-auto max-w-3xl">
          <p className="kicker mb-2">Help // New request</p>
          <h1 className="text-headline-lg font-semibold">Post a help request</h1>
          <p className="mb-6 mt-1 text-body-sm text-on-surface-variant">
            Don’t include your phone number, home address or other private details.
          </p>
          <HelpRequestForm />
        </div>
      </RequireAuth>
    </main>
  );
}
