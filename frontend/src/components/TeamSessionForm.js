'use client';

// Create (session = null) or edit a team session / event.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { ErrorSummary, Field, SubmitButton } from '@/components/ui/Form';
import { api } from '@/lib/api';
import { toDateTimeLocal } from '@/lib/format';
import { useAction } from '@/lib/hooks';

export function TeamSessionForm({ team, session }) {
  const isEdit = Boolean(session);
  const router = useRouter();
  const { notify } = useApp();
  const { busy, errors, run } = useAction();
  const [minDateTime] = useState(() => toDateTimeLocal(new Date()));
  const [values, setValues] = useState({
    title: session?.title || '',
    description: session?.description || '',
    startsAt: toDateTimeLocal(session?.starts_at),
    endsAt: toDateTimeLocal(session?.ends_at),
    locationLabel: session?.location_label || '',
  });
  const set = (name) => (event) => setValues({ ...values, [name]: event.target.value });
  const backUrl = isEdit ? `/teams/${team.id}/sessions/${session.id}` : `/teams/${team.id}`;

  async function handleSubmit(event) {
    event.preventDefault();
    const base = `/teams/${team.id}/sessions`;
    const result = await run(() => (isEdit ? api.put(`${base}/${session.id}`, values) : api.post(base, values)));
    if (!result) return;
    const to = `${base}/${isEdit ? session.id : result.data.id}`;
    notify(result.message, 'success', to);
    router.push(to);
  }

  return (
    <>
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field name="title" label="Title" required minLength={3} maxLength={150} placeholder="e.g. Exam review session"
               value={values.title} onChange={set('title')} error={errors.title} />
        <Field as="textarea" name="description" label="Description" optional="optional" rows={4} maxLength={2000}
               value={values.description} onChange={set('description')} error={errors.description} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field name="startsAt" label="Starts" type="datetime-local" required min={isEdit ? undefined : minDateTime}
                 value={values.startsAt} onChange={set('startsAt')} error={errors.startsAt} />
          <Field name="endsAt" label="Ends" type="datetime-local" required min={values.startsAt || undefined}
                 value={values.endsAt} onChange={set('endsAt')} error={errors.endsAt} />
        </div>
        <Field name="locationLabel" label="General location" optional="optional" maxLength={150} placeholder="e.g. Library, group room 3"
               value={values.locationLabel} onChange={set('locationLabel')} error={errors.locationLabel} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton busy={busy}>{isEdit ? 'Save changes' : 'Create session'}</SubmitButton>
          <Link href={backUrl} className="btn btn-muted">Cancel</Link>
        </div>
      </form>
    </>
  );
}
