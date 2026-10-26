'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { RequestNextStep } from '@/components/RequestNextStep';
import { ActionButton } from '@/components/ui/ActionButton';
import { ErrorSummary, Field, RadioGroup, SubmitButton } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { Avatar, BackLink, DetailList, Section } from '@/components/ui/Page';
import { Chip, StatusChip } from '@/components/ui/Status';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime, initials, timeAgo } from '@/lib/format';
import { useAction, useApi, useTitle } from '@/lib/hooks';
import { loginUrl } from '@/lib/safeRedirect';

// open -> matched -> completed, shown as the pipeline bar at the top
const STEPS = [
  { status: 'open', label: '01 Posted', note: 'Waiting for offers' },
  { status: 'matched', label: '02 Matched', note: 'Helper accepted' },
  { status: 'completed', label: '03 Completed', note: 'Session done' },
];

function Pipeline({ status }) {
  const current = STEPS.findIndex((step) => step.status === status);
  return (
    <ol className="card grid grid-cols-3 gap-2 p-3!" aria-label="Request progress">
      {STEPS.map((step, index) => {
        const state = status === 'cancelled' ? 'todo' : index < current || status === 'completed' ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={step.status} aria-current={state === 'current' ? 'step' : undefined}
              className={`flex flex-col rounded p-2 ${state === 'current' ? 'border-l-2 border-primary-container bg-primary-container/15' : 'bg-surface-container'} ${state === 'todo' ? 'opacity-60' : ''}`}>
            <span className={`flex items-center gap-1 font-mono text-label-sm font-bold uppercase ${state === 'done' ? 'text-tertiary-fixed' : state === 'current' ? 'text-primary-container' : 'text-on-surface-variant'}`}>
              {state === 'done' && <Icon name="check" className="text-[14px]!" />}
              {state === 'current' && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary-container" aria-hidden="true" />}
              {step.label}
            </span>
            <span className="mt-0.5 hidden font-mono text-label-sm text-on-surface sm:block">{step.note}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OffersReceived({ request, offers, onChange }) {
  const { meta, notify } = useApp();
  const router = useRouter();
  const pending = offers.filter((offer) => offer.status === 'pending').length;

  return (
    <Section title={`Incoming help offers (${offers.length})`} icon={<Icon name="inbox" className="text-tertiary-fixed" />}
             actions={pending > 0 && <Chip color="chip-amber">{pending} pending</Chip>}>
      {offers.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">No offers yet. You’ll see them here when someone offers to help.</p>
      ) : (
        <ul className="space-y-2">
          {offers.map((offer) => (
            <li key={offer.id} className="panel flex flex-col justify-between gap-4 p-4! md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <Avatar text={initials(offer.helper_name)} color="text-secondary" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body-md font-semibold">{offer.helper_name}</span>
                    {offer.helper_major && <Chip color="chip-cyan">{offer.helper_major}</Chip>}
                    <StatusChip kind="offer" status={offer.status} />
                  </div>
                  <p className="mt-1 whitespace-pre-line text-body-sm text-on-surface-variant">“{offer.message}”</p>
                  <span className="mt-1 block font-mono text-label-sm text-outline">
                    Prefers {meta.SUPPORT_MODES[offer.preferred_mode]} · sent {timeAgo(offer.created_at)}
                  </span>
                </div>
              </div>
              {offer.status === 'pending' && request.status === 'open' && (
                <div className="flex shrink-0 gap-2 self-end md:self-center">
                  <ActionButton className="btn-success" action={() => api.post(`/offers/${offer.id}/accept`)}
                                confirm={`Accept ${offer.helper_name}’s offer? Other pending offers will be closed.`}
                                onDone={(result) => {
                                  const to = `/sessions/${result.data.sessionId}`;
                                  notify(result.message, 'success', to);
                                  router.push(to);
                                }}>
                    Accept
                  </ActionButton>
                  <ActionButton action={() => api.post(`/offers/${offer.id}/decline`)} confirm={`Decline ${offer.helper_name}’s offer?`}
                                onDone={(result) => { notify(result.message); onChange(); }}>
                    Decline
                  </ActionButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function OfferForm({ request, myOffer, onDone }) {
  const { meta, notify } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState({ message: '', preferredMode: request.support_mode });

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => api.post(`/help-requests/${request.id}/offers`, values));
    if (!result) return;
    notify(result.message);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorSummary errors={errors} />
      <RadioGroup name="preferredMode" legend="How would you like to help?" options={meta.SUPPORT_MODES} value={values.preferredMode}
                  onChange={(preferredMode) => setValues({ ...values, preferredMode })} error={errors.preferredMode} />
      <Field as="textarea" name="message" label="Message" rows={4} required minLength={10} maxLength={1000}
             placeholder="How can you help? When are you free?"
             hint="Only the request owner can read this. Don’t include your phone number."
             value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} error={errors.message} />
      <SubmitButton busy={busy} className="btn-primary btn-block">
        <Icon name="bolt" /> {myOffer ? 'Send a new offer' : 'Send help offer'}
      </SubmitButton>
    </form>
  );
}

function OfferPanel({ request, myOffer, onChange }) {
  const { user, notify } = useApp();
  const pathname = usePathname();
  const hasActiveOffer = myOffer && ['pending', 'accepted'].includes(myOffer.status);

  return (
    <Section title={myOffer ? 'Your offer' : 'Send help offer'} icon={<Icon name="send" className="text-primary-container" />}>
      {myOffer && (
        <div className="panel space-y-2">
          <div className="flex items-center justify-between">
            <StatusChip kind="offer" status={myOffer.status} />
            <span className="font-mono text-label-sm text-on-surface-variant">Sent {timeAgo(myOffer.created_at)}</span>
          </div>
          <p className="whitespace-pre-line text-body-sm text-on-surface-variant">“{myOffer.message}”</p>
          {myOffer.status === 'pending' && (
            <ActionButton block className="btn-danger" action={() => api.post(`/offers/${myOffer.id}/withdraw`)} confirm="Withdraw your offer?"
                          onDone={(result) => { notify(result.message); onChange(); }}>
              Withdraw offer
            </ActionButton>
          )}
        </div>
      )}

      {!hasActiveOffer &&
        (request.status !== 'open' ? (
          <p className="text-body-sm text-on-surface-variant">This request is no longer accepting offers.</p>
        ) : user ? (
          <OfferForm request={request} myOffer={myOffer} onDone={onChange} />
        ) : (
          <Link href={loginUrl(pathname)} className="btn btn-primary btn-block">Log in to offer help</Link>
        ))}
    </Section>
  );
}

function OwnerPanel({ request, session, onChange }) {
  const { meta, notify } = useApp();
  return (
    <Section title="Your request" icon={<Icon name="tune" className="text-secondary" />}>
      {request.status === 'open' ? (
        <div className="space-y-3">
          <Link href={`/help/${request.id}/edit`} className="btn btn-primary btn-block">Edit request</Link>
          <ActionButton block className="btn-danger" action={() => api.post(`/help-requests/${request.id}/cancel`)}
                        confirm="Cancel this help request? People will no longer be able to offer help."
                        onDone={(result) => { notify(result.message); onChange(); }}>
            Cancel request
          </ActionButton>
        </div>
      ) : request.status === 'matched' && session && session.status === 'cancelled' ? (
        <RequestNextStep requestId={request.id} onDone={onChange} />
      ) : request.status === 'matched' ? (
        <p className="text-body-sm text-on-surface-variant">You’ve accepted a helper. Complete or cancel the help session to change this request.</p>
      ) : (
        <p className="text-body-sm text-on-surface-variant">
          This request is {meta.HELP_REQUEST_STATUSES[request.status].toLowerCase()} and can no longer be changed.
        </p>
      )}
    </Section>
  );
}

export default function HelpRequestPage() {
  const { id } = useParams();
  const { meta } = useApp();
  const { data, error, reload } = useApi(`/help-requests/${id}`);
  useTitle(data ? data.data.title : 'Help request');

  if (error) return <main id="main" className="container-page py-10"><ErrorState status={error.status} message={error.message} /></main>;
  if (!data) return <main id="main" className="container-page py-10"><LoadingState /></main>;

  const { data: request, isOwner, offers, myOffer, session } = data;
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <BackLink href="/help">Back to help requests</BackLink>

      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <p className="kicker text-secondary!">Request inspector // #REQ-{String(request.id).padStart(4, '0')}</p>
        <div className="flex flex-wrap gap-2">
          <StatusChip kind="help" status={request.status} />
          {isOwner && offers.some((offer) => offer.status === 'pending') && (
            <Chip color="chip-amber">{offers.filter((offer) => offer.status === 'pending').length} offers pending</Chip>
          )}
        </div>
      </div>

      <Pipeline status={request.status} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <article className="card space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-headline font-bold text-on-primary" aria-hidden="true">
                  {initials(request.author_name)}
                </span>
                <div>
                  <p className="text-body-md font-bold">{request.author_name}</p>
                  <p className="font-mono text-label-sm text-on-surface-variant">
                    {request.author_major || 'Student'} · posted {formatDateTime(request.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-headline-md font-bold text-primary">{request.title}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="chip chip-solid-cyan">{meta.HELP_CATEGORIES[request.category]}</span>
                <Chip color="chip-violet">{meta.SUPPORT_MODES[request.support_mode]}</Chip>
              </div>
            </div>

            <div className="rounded-md bg-surface-container-lowest p-4">
              <h2 className="mb-2 font-mono text-label-md uppercase text-primary-container">Description</h2>
              <p className="whitespace-pre-line text-body-sm text-on-surface-variant">{request.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="panel">
                <span className="mb-1 block font-mono text-label-sm uppercase text-on-surface-variant">Where</span>
                <p className="flex items-center gap-1 text-body-sm font-semibold">
                  <Icon name={request.support_mode === 'online' ? 'videocam' : 'pin_drop'} className="text-primary-container" />
                  {request.location_label || meta.SUPPORT_MODES[request.support_mode]}
                </p>
              </div>
              <div className="panel">
                <span className="mb-1 block font-mono text-label-sm uppercase text-on-surface-variant">When</span>
                <p className="flex items-center gap-1 text-body-sm font-semibold">
                  <Icon name="event_available" className="text-secondary" />
                  {request.scheduled_at ? formatDateTime(request.scheduled_at) : 'Not set yet'}
                </p>
              </div>
            </div>

            <p className="flex items-center gap-3 rounded-md bg-surface-container-high/50 p-3 text-body-sm text-on-surface-variant">
              <Icon name="shield" className="text-[20px]! text-tertiary-fixed" />
              Help each other learn: explain and review together, but don’t do someone else’s graded work for them.
            </p>
          </article>

          {isOwner && <OffersReceived request={request} offers={offers} onChange={reload} />}
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          {isOwner ? <OwnerPanel request={request} session={session} onChange={reload} /> : <OfferPanel request={request} myOffer={myOffer} onChange={reload} />}

          {session && (
            <Section title="Help session" icon={<Icon name="handshake" className="text-tertiary-fixed" />}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-label-md text-on-surface-variant">Status</span>
                <StatusChip kind="session" status={session.status} />
              </div>
              <Link href={`/sessions/${session.id}`} className="btn btn-primary btn-block">View help session</Link>
            </Section>
          )}

          <Section title="Details" icon={<Icon name="info" className="text-primary-container" />}>
            <DetailList items={[
              ['Support type', meta.SUPPORT_MODES[request.support_mode]],
              ['When', request.scheduled_at ? formatDateTime(request.scheduled_at) : 'Not set yet'],
              request.location_label && ['Where', request.location_label],
              ['Status', meta.HELP_REQUEST_STATUSES[request.status]],
            ]} />
          </Section>
        </aside>
      </div>
    </main>
  );
}
