'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { RequestNextStep } from '@/components/RequestNextStep';
import { ActionButton } from '@/components/ui/ActionButton';
import { ErrorSummary, Field, RadioGroup, SubmitButton } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { BackLink, DetailList, Section } from '@/components/ui/Page';
import { Chip, StatusChip } from '@/components/ui/Status';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime, toDateTimeLocal, truncate } from '@/lib/format';
import { useAction, useApi, useTitle } from '@/lib/hooks';

const STEPS = ['scheduled', 'in_progress', 'completed'];

function Progress({ session, startBlockers, isRequester, showRequestChoice, onChange }) {
  const { meta, notify } = useApp();
  const current = STEPS.indexOf(session.status);
  const isActive = ['scheduled', 'in_progress'].includes(session.status);
  const act = (path) => () => api.post(`/sessions/${session.id}/${path}`);
  const done = (result) => {
    notify(result.message);
    onChange();
  };

  return (
    <Section title="Progress" icon={<Icon name="timeline" className="text-primary-container" />}>
      <ol className="grid grid-cols-3 gap-2" aria-label="Session steps">
        {STEPS.map((step, index) => {
          const state = session.status === 'cancelled' ? 'todo'
            : index < current || session.status === 'completed' ? 'done'
            : index === current ? 'current' : 'todo';
          return (
            <li key={step} aria-current={state === 'current' ? 'step' : undefined}
                className={`rounded p-2 font-mono text-label-sm font-bold uppercase ${
                  state === 'done' ? 'bg-surface-container text-tertiary-fixed'
                  : state === 'current' ? 'border-l-2 border-primary-container bg-primary-container/15 text-primary-container'
                  : 'bg-surface-container text-on-surface-variant opacity-60'}`}>
              {state === 'done' && '✓ '}{meta.SESSION_STATUSES[step]}
            </li>
          );
        })}
      </ol>

      {session.status === 'scheduled' &&
        (startBlockers.length === 0 ? (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">Everything is agreed. Start the session when you meet.</p>
            <ActionButton className="btn-primary" action={act('start')} onDone={done}>Start session</ActionButton>
          </div>
        ) : (
          <div>
            <p className="text-body-sm text-on-surface-variant">Before you can start:</p>
            <ul className="mt-2 space-y-1">
              {startBlockers.map((blocker) => (
                <li key={blocker} className="flex items-center gap-2 font-mono text-label-md text-warning">
                  <Icon name="radio_button_unchecked" className="text-[14px]!" /> {blocker}
                </li>
              ))}
            </ul>
          </div>
        ))}

      {session.status === 'in_progress' && (
        <div className="space-y-3">
          <p className="text-body-sm text-on-surface-variant">The session is in progress. Mark it as completed when you’re done.</p>
          <ActionButton className="btn-success" action={act('complete')} onDone={done}
                        confirm="Mark this session as completed? The help request will be marked Completed too.">
            Mark as completed
          </ActionButton>
        </div>
      )}

      {session.status === 'completed' && (
        <p className="text-body-sm text-on-surface-variant">This session is complete and the help request has been marked Completed.</p>
      )}

      {session.status === 'cancelled' && (
        <>
          <p className="text-body-sm text-on-surface-variant">This session was cancelled.</p>
          {showRequestChoice && <RequestNextStep requestId={session.help_request_id} onDone={onChange} />}
        </>
      )}

      {isActive && (
        <div className="border-t border-white/5 pt-4">
          <ActionButton className="btn-danger" action={act('cancel')} onDone={done}
                        confirm={`Cancel this help session? ${isRequester ? 'You can then reopen your request to find another helper.' : 'The requester can then look for another helper.'}`}>
            Cancel session
          </ActionButton>
        </div>
      )}
    </Section>
  );
}

function ProposalCard({ session, partner, proposedByMe, onChange }) {
  const { meta, notify } = useApp();
  const act = (path) => () => api.post(`/sessions/${session.id}/proposal/${path}`);
  const done = (result) => {
    notify(result.message);
    onChange();
  };

  return (
    <section className="card space-y-4 border-secondary/40!">
      <h2 className="text-headline-sm font-medium text-secondary">
        {proposedByMe ? 'Your proposal' : `${partner.name} proposed new details`}
      </h2>
      <DetailList items={[
        ['Support type', <>{meta.SUPPORT_MODES[session.proposed_mode]} {session.proposed_mode !== session.mode && <Chip color="chip-amber">changed</Chip>}</>],
        ['When', formatDateTime(session.proposed_scheduled_at)],
        session.proposed_mode === 'in_person' && ['Where', session.proposed_location_label],
      ]} />
      {proposedByMe ? (
        <>
          <p className="field-hint">Waiting for {partner.name} to accept.</p>
          <ActionButton block action={act('withdraw')} onDone={done}>Withdraw proposal</ActionButton>
        </>
      ) : (
        <div className="space-y-2">
          <ActionButton block className="btn-primary" action={act('accept')} onDone={done}>Accept new details</ActionButton>
          <ActionButton block action={act('decline')} onDone={done}>Decline</ActionButton>
        </div>
      )}
    </section>
  );
}

function ProposeForm({ session, partner, onChange }) {
  const { meta, notify } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState({
    mode: session.mode,
    scheduledAt: toDateTimeLocal(session.scheduled_at),
    locationLabel: session.location_label || '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => api.post(`/sessions/${session.id}/proposal`, values));
    if (!result) return;
    notify(result.message);
    onChange();
  }

  return (
    <section className="card">
      <details className="group" open={Object.keys(errors).length > 0 || undefined}>
        <summary className="cursor-pointer text-headline-sm font-medium marker:text-primary-container">Propose different details</summary>
        <p className="field-hint mb-4">
          e.g. switch to online if you can’t meet in person. {partner.name} has to accept the change.
        </p>
        <ErrorSummary errors={errors} />
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <RadioGroup name="mode" legend="Support type" options={meta.SUPPORT_MODES} value={values.mode}
                      onChange={(mode) => setValues({ ...values, mode })} error={errors.mode} />
          <Field name="scheduledAt" label="When" type="datetime-local" required value={values.scheduledAt}
                 onChange={(event) => setValues({ ...values, scheduledAt: event.target.value })} error={errors.scheduledAt} />
          {values.mode === 'in_person' && (
            <Field name="locationLabel" label="Where to meet" maxLength={150} placeholder="e.g. Library, group room 2"
                   value={values.locationLabel} onChange={(event) => setValues({ ...values, locationLabel: event.target.value })}
                   error={errors.locationLabel} />
          )}
          <SubmitButton busy={busy} className="btn-primary btn-block">Send proposal</SubmitButton>
        </form>
      </details>
    </section>
  );
}

function SessionDetail({ id }) {
  const { meta } = useApp();
  const { data, error, reload } = useApi(`/sessions/${id}`);

  if (error) return <ErrorState status={error.status} message={error.message} />;
  if (!data) return <LoadingState />;

  const { data: session, isRequester, partner, startBlockers, proposedByMe, showRequestChoice } = data;
  const hasProposal = Boolean(session.proposed_by_user_id);

  return (
    <>
      <BackLink href="/sessions">My help sessions</BackLink>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <article className="card space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <StatusChip kind="session" status={session.status} />
              <Chip color="chip-violet">{isRequester ? 'You asked for help' : 'You’re helping'}</Chip>
            </div>
            <h1 className="text-headline-lg font-semibold">Help session</h1>
            <p className="font-mono text-label-md text-on-surface-variant">
              For the request <Link href={`/help/${session.help_request_id}`} className="text-primary-container underline">{session.request_title}</Link>
              {' · '}created {formatDateTime(session.created_at)}
            </p>
            <div className="rounded-md bg-surface-container-lowest p-4">
              <h2 className="mb-2 font-mono text-label-md uppercase text-primary-container">What it’s about</h2>
              <p className="whitespace-pre-line text-body-sm text-on-surface-variant">{truncate(session.request_description, 400)}</p>
            </div>
          </article>
          <Progress session={session} startBlockers={startBlockers} isRequester={isRequester} showRequestChoice={showRequestChoice} onChange={reload} />
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <Section title="Agreed details" icon={<Icon name="event_available" className="text-secondary" />}>
            <DetailList items={[
              ['Support type', meta.SUPPORT_MODES[session.mode]],
              ['When', session.scheduled_at ? formatDateTime(session.scheduled_at) : 'Not agreed yet'],
              session.mode === 'in_person' && ['Where', session.location_label || 'Not agreed yet'],
            ]} />
          </Section>

          {hasProposal ? (
            <ProposalCard session={session} partner={partner} proposedByMe={proposedByMe} onChange={reload} />
          ) : (
            session.status === 'scheduled' && <ProposeForm key={session.scheduled_at} session={session} partner={partner} onChange={reload} />
          )}

          <Section title={partner.role} icon={<Icon name="person" className="text-primary-container" />}>
            <p className="text-body-md font-semibold">{partner.name}</p>
            <a href={`mailto:${partner.email}`} className="text-body-sm text-primary-container underline">{partner.email}</a>
            <p className="field-hint">Only you two can see this email. Use it to agree on a time and place.</p>
          </Section>
        </aside>
      </div>
    </>
  );
}

export default function SessionPage() {
  useTitle('Help session');
  const { id } = useParams();
  return (
    <main id="main" className="container-page py-10">
      <RequireAuth>
        <SessionDetail id={id} />
      </RequireAuth>
    </main>
  );
}
