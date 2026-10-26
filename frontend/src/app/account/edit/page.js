'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ErrorSummary, Field, SubmitButton } from '@/components/ui/Form';
import { BackLink } from '@/components/ui/Page';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { useAction, useApi, useTitle } from '@/lib/hooks';

function ProfileForm({ profile }) {
  const router = useRouter();
  const { notify, setUser } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState({ fullName: profile.full_name, major: profile.major || '' });

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => api.put('/account', values));
    if (!result) return;
    setUser(result.user); // keep the name in the header up to date
    notify(result.message, 'success', '/account');
    router.push('/account');
  }

  return (
    <>
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field name="email" label="Email" type="email" value={profile.email} disabled hint="Your email is used to log in and can’t be changed." />
        <Field name="fullName" label="Full name" autoComplete="name" required maxLength={100}
               value={values.fullName} onChange={(event) => setValues({ ...values, fullName: event.target.value })} error={errors.fullName} />
        <Field name="major" label="Major" optional="optional" maxLength={100}
               value={values.major} onChange={(event) => setValues({ ...values, major: event.target.value })} error={errors.major} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton busy={busy}>Save changes</SubmitButton>
          <Link href="/account" className="btn btn-muted">Cancel</Link>
        </div>
      </form>
    </>
  );
}

function EditProfile() {
  const { data, error } = useApi('/account');
  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;
  return <ProfileForm profile={data.profile} />;
}

export default function EditProfilePage() {
  useTitle('Edit profile');
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <BackLink href="/account">Back to My Account</BackLink>
        <div className="card mx-auto max-w-md">
          <p className="kicker mb-2">Account // Edit</p>
          <h1 className="mb-6 text-headline-lg font-semibold">Edit profile</h1>
          <EditProfile />
        </div>
      </RequireAuth>
    </main>
  );
}
