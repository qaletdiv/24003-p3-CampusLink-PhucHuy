'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { ActionButton } from '@/components/ui/ActionButton';
import { Icon } from '@/components/ui/Icon';
import { BackLink, DetailList, Section } from '@/components/ui/Page';
import { Chip, LostFoundType, StatusChip } from '@/components/ui/Status';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useApi, useTitle } from '@/lib/hooks';

// Status buttons the owner can use, depending on the current status
const STATUS_ACTIONS = {
  open: [
    { status: 'resolved', label: 'Mark as resolved', className: 'btn-success' },
    { status: 'closed', label: 'Close without resolving', className: 'btn-muted' },
  ],
  resolved: [{ status: 'open', label: 'Reopen post', className: 'btn-muted' }],
  closed: [{ status: 'open', label: 'Reopen post', className: 'btn-muted' }],
};

export default function LostFoundPostPage() {
  const { id } = useParams();
  const { meta, notify } = useApp();
  const { data, error, reload } = useApi(`/lost-found/${id}`);
  useTitle(data ? data.data.title : 'Lost & Found');

  if (error) return <main id="main" className="container-page py-10"><ErrorState status={error.status} message={error.message} /></main>;
  if (!data) return <main id="main" className="container-page py-10"><LoadingState /></main>;

  const { data: post, isOwner } = data;
  return (
    <main id="main" className="container-page py-10">
      <BackLink href="/lost-found">Back to Lost &amp; Found</BackLink>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <article className="card space-y-4 lg:col-span-7">
          <div className="flex flex-wrap gap-1.5">
            <LostFoundType type={post.post_type} />
            <Chip>{meta.LOST_FOUND_CATEGORIES[post.category]}</Chip>
            <StatusChip kind="lostFound" status={post.status} />
          </div>
          <h1 className="text-headline-lg font-semibold">{post.title}</h1>
          <p className="font-mono text-label-md text-on-surface-variant">
            Posted by {post.author_name} · {formatDateTime(post.created_at)}
          </p>

          {post.image_url && (
            // no-referrer: the image host doesn't learn which page the viewer came from
            // eslint-disable-next-line @next/next/no-img-element -- user-supplied link from any host
            <img src={post.image_url} alt={`Photo of: ${post.title}`} loading="lazy" referrerPolicy="no-referrer"
                 className="max-h-[420px] w-full rounded-md bg-surface-container-highest object-contain" />
          )}

          <div className="rounded-md bg-surface-container-lowest p-4">
            <h2 className="mb-2 font-mono text-label-md uppercase text-primary-container">Description</h2>
            <p className="whitespace-pre-line text-body-sm text-on-surface-variant">{post.description}</p>
          </div>

          <p className="flex items-start gap-3 rounded-md bg-surface-container-high/50 p-3 text-body-sm text-on-surface-variant">
            <Icon name="shield" className="text-[20px]! text-tertiary-fixed" />
            <span>
              <strong className="text-on-surface">Before handing anything over:</strong> ask the other person to describe the
              item or show proof that it’s theirs. CampusLink can’t verify ownership.
            </span>
          </p>
        </article>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <Section title="Details" icon={<Icon name="info" className="text-primary-container" />}>
            <DetailList items={[
              ['Where', post.location_label],
              [post.post_type === 'lost' ? 'Lost on' : 'Found on', post.occurred_at ? formatDateTime(post.occurred_at) : 'Not specified'],
              ['Status', meta.LOST_FOUND_STATUSES[post.status]],
            ]} />
          </Section>

          <Section title="Contact" icon={<Icon name="contact_mail" className="text-secondary" />}>
            {post.contact_info ? (
              <>
                <p className="break-words font-mono text-label-lg text-primary-container">{post.contact_info}</p>
                <p className="field-hint">Shared by the poster on purpose.</p>
              </>
            ) : (
              <p className="text-body-sm text-on-surface-variant">
                The poster didn’t share contact details. Check back later, or look for a notice at the location.
              </p>
            )}
          </Section>

          {isOwner && (
            <Section title="Your post" icon={<Icon name="tune" className="text-tertiary-fixed" />}>
              <div className="space-y-3">
                {post.status === 'open' && <Link href={`/lost-found/${post.id}/edit`} className="btn btn-primary btn-block">Edit post</Link>}
                {STATUS_ACTIONS[post.status].map((action) => (
                  <ActionButton key={action.status} block className={action.className}
                                action={() => api.patch(`/lost-found/${post.id}/status`, { status: action.status })}
                                onDone={(result) => { notify(result.message); reload(); }}>
                    {action.label}
                  </ActionButton>
                ))}
              </div>
            </Section>
          )}
        </aside>
      </div>
    </main>
  );
}
