'use client';

// Create (post = null) or edit a Lost & Found post.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { Checkbox, ErrorSummary, Field, Options, RadioGroup, SubmitButton } from '@/components/ui/Form';
import { api } from '@/lib/api';
import { toDateTimeLocal } from '@/lib/format';
import { useAction } from '@/lib/hooks';

const POST_TYPES = { lost: 'I lost something', found: 'I found something' };

function initialValues(post, postType) {
  if (!post) {
    return { postType, title: '', description: '', category: '', locationLabel: '', occurredAt: '', imageUrl: '', shareContact: false, contactInfo: '' };
  }
  return {
    postType: post.post_type,
    title: post.title,
    description: post.description,
    category: post.category,
    locationLabel: post.location_label,
    occurredAt: toDateTimeLocal(post.occurred_at),
    imageUrl: post.image_url || '',
    shareContact: Boolean(post.contact_info),
    contactInfo: post.contact_info || '',
  };
}

export function LostFoundForm({ post, postType = '' }) {
  const isEdit = Boolean(post);
  const router = useRouter();
  const { meta, notify } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState(() => initialValues(post, postType));
  const [maxDateTime] = useState(() => toDateTimeLocal(new Date()));
  const set = (name) => (event) => setValues({ ...values, [name]: event.target.value });
  const backUrl = isEdit ? `/lost-found/${post.id}` : '/lost-found';

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => (isEdit ? api.put(`/lost-found/${post.id}`, values) : api.post('/lost-found', values)));
    if (!result) return;
    const to = `/lost-found/${isEdit ? post.id : result.data.id}`;
    notify(result.message, 'success', to);
    router.push(to);
  }

  return (
    <>
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <RadioGroup name="postType" legend="What happened?" options={POST_TYPES} value={values.postType}
                    onChange={(value) => setValues({ ...values, postType: value })} error={errors.postType} />
        <Field name="title" label="Title" required minLength={5} maxLength={150} placeholder="e.g. Black backpack with a red keychain"
               value={values.title} onChange={set('title')} error={errors.title} />
        <Field as="textarea" name="description" label="Description" rows={5} required minLength={10} maxLength={2000}
               placeholder="Colour, brand, anything distinctive…" value={values.description} onChange={set('description')} error={errors.description} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field as="select" name="category" label="Category" required value={values.category} onChange={set('category')} error={errors.category}>
            <Options map={meta.LOST_FOUND_CATEGORIES} placeholder="Choose a category" />
          </Field>
          <Field name="occurredAt" label="When" optional="optional" type="datetime-local" max={maxDateTime}
                 value={values.occurredAt} onChange={set('occurredAt')} error={errors.occurredAt} />
        </div>
        <Field name="locationLabel" label="General location" required maxLength={150} placeholder="e.g. Library, 2nd floor"
               value={values.locationLabel} onChange={set('locationLabel')} error={errors.locationLabel} />
        <Field name="imageUrl" label="Photo link" optional="optional" type="url" maxLength={500} placeholder="https://…"
               value={values.imageUrl} onChange={set('imageUrl')} error={errors.imageUrl} />

        <div className="space-y-3 rounded-md border border-white/5 p-4">
          <Checkbox name="shareContact" checked={values.shareContact} onChange={(shareContact) => setValues({ ...values, shareContact })}>
            Show my contact info on this post <span className="text-outline">(anyone can see it)</span>
          </Checkbox>
          {values.shareContact && (
            <Field name="contactInfo" label="Contact info" maxLength={150} placeholder="e.g. your student email"
                   hint="Only share your own contact details. Leave the box unticked to keep them private."
                   value={values.contactInfo} onChange={set('contactInfo')} error={errors.contactInfo} />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <SubmitButton busy={busy}>{isEdit ? 'Save changes' : 'Publish post'}</SubmitButton>
          <Link href={backUrl} className="btn btn-muted">Cancel</Link>
        </div>
      </form>
    </>
  );
}
