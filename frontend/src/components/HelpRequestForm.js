'use client';

// Same form for creating (request = null) and editing (request = the current row).
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { Checkbox, ErrorSummary, Field, Options, RadioGroup, SubmitButton } from '@/components/ui/Form';
import { api } from '@/lib/api';
import { toDateTimeLocal } from '@/lib/format';
import { useAction } from '@/lib/hooks';

function initialValues(request) {
  if (!request) {
    return { title: '', description: '', category: '', supportMode: 'in_person', locationLabel: '', scheduledAt: '' };
  }
  return {
    title: request.title,
    description: request.description,
    category: request.category,
    supportMode: request.support_mode,
    locationLabel: request.location_label || '',
    scheduledAt: toDateTimeLocal(request.scheduled_at),
  };
}

export function HelpRequestForm({ request }) {
  const isEdit = Boolean(request);
  const router = useRouter();
  const { meta, notify } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState(() => initialValues(request));
  const [confirmModeChange, setConfirmModeChange] = useState(false);
  const [minDateTime] = useState(() => toDateTimeLocal(new Date()));

  const modeChanged = isEdit && values.supportMode !== request.support_mode;
  const set = (name) => (event) => setValues({ ...values, [name]: event.target.value });
  const backUrl = isEdit ? `/help/${request.id}` : '/help';

  async function handleSubmit(event) {
    event.preventDefault();
    const body = { ...values, confirmModeChange: modeChanged && confirmModeChange };
    const result = await run(() => (isEdit ? api.put(`/help-requests/${request.id}`, body) : api.post('/help-requests', body)));
    if (!result) return;

    const id = isEdit ? request.id : result.data.id;
    notify(result.message, 'success', `/help/${id}`);
    router.push(`/help/${id}`);
  }

  return (
    <>
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field name="title" label="Title" required minLength={5} maxLength={150} placeholder="e.g. Need help with recursion in Python"
               value={values.title} onChange={set('title')} error={errors.title} />
        <Field as="textarea" name="description" label="Description" rows={6} required minLength={10} maxLength={5000}
               placeholder="What do you need help with? What have you tried so far?"
               value={values.description} onChange={set('description')} error={errors.description} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field as="select" name="category" label="Category" required value={values.category} onChange={set('category')} error={errors.category}>
            <Options map={meta.HELP_CATEGORIES} placeholder="Choose a category" />
          </Field>
          <Field name="scheduledAt" label="When" optional="optional" type="datetime-local" min={isEdit ? undefined : minDateTime}
                 value={values.scheduledAt} onChange={set('scheduledAt')} error={errors.scheduledAt} />
        </div>

        <RadioGroup name="supportMode" legend="Support type" options={meta.SUPPORT_MODES} value={values.supportMode}
                    onChange={(supportMode) => setValues({ ...values, supportMode })} error={errors.supportMode} />

        {values.supportMode === 'in_person' && (
          <Field name="locationLabel" label="General location" optional="optional, in person only" maxLength={150}
                 placeholder="e.g. Library, 2nd floor" value={values.locationLabel} onChange={set('locationLabel')} error={errors.locationLabel} />
        )}

        {modeChanged && (
          <Checkbox name="confirmModeChange" checked={confirmModeChange} onChange={setConfirmModeChange} error={errors.confirmModeChange}>
            I confirm I want to change the support type (currently <strong>{meta.SUPPORT_MODES[request.support_mode]}</strong>).
          </Checkbox>
        )}

        <div className="flex flex-wrap gap-2">
          <SubmitButton busy={busy}>{isEdit ? 'Save changes' : 'Post request'}</SubmitButton>
          <Link href={backUrl} className="btn btn-muted">Cancel</Link>
        </div>
      </form>
    </>
  );
}
