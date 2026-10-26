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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'), '');
  const { login } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState({ email: '', password: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => api.post('/auth/login', values));
    if (!result) return setValues((current) => ({ ...current, password: '' }));
    login(result);
    router.push(returnTo || '/');
  }

  const set = (name) => (event) => setValues({ ...values, [name]: event.target.value });
  const registerHref = `/register${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;

  return (
    <div className="card mx-auto max-w-md">
      <p className="kicker mb-2">Auth // Secure login</p>
      <h1 className="text-headline-lg font-semibold">Log in</h1>
      <p className="mb-6 mt-1 text-body-md text-on-surface-variant">Welcome back to CampusLink.</p>

      <ErrorSummary errors={errors} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field name="email" label="Email" type="email" autoComplete="email" required value={values.email} onChange={set('email')} error={errors.email} />
        <Field name="password" label="Password" type="password" autoComplete="current-password" required value={values.password} onChange={set('password')} error={errors.password} />
        <SubmitButton busy={busy} className="btn-primary btn-block">Log in</SubmitButton>
      </form>

      <p className="mt-6 text-center text-body-sm text-on-surface-variant">
        New to CampusLink? <Link href={registerHref} className="text-primary-container underline">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  useTitle('Log in');
  return (
    <main id="main" className="container-page py-12">
      <GuestOnly>
        <Suspense>
          <LoginForm />
        </Suspense>
      </GuestOnly>
    </main>
  );
}
