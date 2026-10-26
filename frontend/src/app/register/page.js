'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { GuestOnly } from '@/components/layout/RequireAuth';
import { ErrorSummary, Field, SubmitButton } from '@/components/ui/Form';
import { api } from '@/lib/api';
import { useAction, useTitle } from '@/lib/hooks';
import { safeReturnTo } from '@/lib/safeRedirect';

const EMPTY = { fullName: '', email: '', major: '', password: '', confirmPassword: '' };

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'), '');
  const returnQuery = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  const { notify } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState(EMPTY);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => api.post('/auth/register', values));
    if (!result) {
      // Passwords are never kept after a failed attempt
      return setValues((current) => ({ ...current, password: '', confirmPassword: '' }));
    }
    notify(result.message, 'success', '/login');
    router.push(`/login${returnQuery}`);
  }

  const set = (name) => (event) => setValues({ ...values, [name]: event.target.value });

  return (
    <div className="card mx-auto max-w-md">
      <p className="kicker mb-2">Auth // New account</p>
      <h1 className="text-headline-lg font-semibold">Create your account</h1>
      <p className="mb-6 mt-1 text-body-md text-on-surface-variant">
        Join CampusLink to ask for help, offer help and join study teams.
      </p>

      <ErrorSummary errors={errors} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field name="fullName" label="Full name" autoComplete="name" required maxLength={100} value={values.fullName} onChange={set('fullName')} error={errors.fullName} />
        <Field name="email" label="Email" type="email" autoComplete="email" required maxLength={255} value={values.email} onChange={set('email')} error={errors.email} />
        <Field name="major" label="Major" optional="optional" maxLength={100} value={values.major} onChange={set('major')} error={errors.major} />
        <Field name="password" label="Password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters." value={values.password} onChange={set('password')} error={errors.password} />
        <Field name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
        <SubmitButton busy={busy} className="btn-primary btn-block">Sign up</SubmitButton>
      </form>

      <p className="mt-6 text-center text-body-sm text-on-surface-variant">
        Already have an account? <Link href={`/login${returnQuery}`} className="text-primary-container underline">Log in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  useTitle('Sign up');
  return (
    <main id="main" className="container-page py-12">
      <GuestOnly>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </GuestOnly>
    </main>
  );
}
