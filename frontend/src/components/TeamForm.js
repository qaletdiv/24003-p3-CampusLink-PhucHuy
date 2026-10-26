'use client';

// Create (team = null) or edit (team = current row) a team.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { ErrorSummary, Field, SubmitButton } from '@/components/ui/Form';
import { api } from '@/lib/api';
import { useAction } from '@/lib/hooks';

export function TeamForm({ team }) {
  const isEdit = Boolean(team);
  const router = useRouter();
  const { notify } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState({ name: team?.name || '', description: team?.description || '' });
  const backUrl = isEdit ? `/teams/${team.id}` : '/teams';

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => (isEdit ? api.put(`/teams/${team.id}`, values) : api.post('/teams', values)));
    if (!result) return;
    const to = `/teams/${isEdit ? team.id : result.data.id}`;
    notify(result.message, 'success', to);
    router.push(to);
  }

  return (
    <>
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field name="name" label="Team name" required minLength={3} maxLength={100} placeholder="e.g. Data Structures Study Group"
               value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} error={errors.name} />
        <Field as="textarea" name="description" label="Description" rows={5} required minLength={10} maxLength={1000}
               placeholder="What does the team do? When and where do you usually meet?"
               value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} error={errors.description} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton busy={busy} className="btn-violet">{isEdit ? 'Save changes' : 'Create team'}</SubmitButton>
          <Link href={backUrl} className="btn btn-muted">Cancel</Link>
        </div>
      </form>
    </>
  );
}
