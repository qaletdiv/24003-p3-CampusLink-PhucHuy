'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useApp } from '@/components/providers/AppProvider';
import { ActionButton } from '@/components/ui/ActionButton';
import { ErrorSummary, Field, RadioGroup, SubmitButton } from '@/components/ui/Form';
import { Icon } from '@/components/ui/Icon';
import { Avatar, BackLink, Section } from '@/components/ui/Page';
import { Chip } from '@/components/ui/Status';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime, initials, plural } from '@/lib/format';
import { useAction, useApi, useTitle } from '@/lib/hooks';
import { loginUrl } from '@/lib/safeRedirect';

// "41:28" until the signal expires; calls onExpire once it reaches zero.
function Countdown({ until, onExpire }) {
  const [now, setNow] = useState(() => Date.now());
  const left = Math.max(0, new Date(until).getTime() - now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (left === 0) onExpire();
  }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSeconds = Math.floor(left / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n) => String(n).padStart(2, '0');
  const text = `${hours ? `${hours}:` : ''}${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;
  return <span className="font-headline text-headline-sm font-bold tracking-widest text-primary-container">{text}</span>;
}

function SignalBanner({ team, signal, onChange }) {
  const { user, notify } = useApp();
  return (
    <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-lg border-l-4 border-secondary bg-gradient-to-r from-secondary-container/40 via-surface-container-low to-primary-container/15 p-6 lg:flex-row lg:items-center">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-secondary" aria-hidden="true" />
          <span className="font-mono text-label-sm font-bold uppercase tracking-widest text-secondary">Team signal active</span>
          <Chip>{signal.location_label}</Chip>
        </div>
        <p className="text-headline-sm font-bold text-on-surface">“{signal.message}”</p>
        <p className="text-body-sm text-on-surface-variant">
          From <strong className="text-on-surface">{signal.sender_name}</strong> · meet at {signal.location_label} · until {formatDateTime(signal.expires_at)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="rounded-md bg-surface-container-lowest/80 px-4 py-2 text-center">
          <span className="block font-mono text-label-sm uppercase text-on-surface-variant">Expires in</span>
          <Countdown until={signal.expires_at} onExpire={onChange} />
        </div>
        {signal.sender_user_id === user.id && (
          <ActionButton action={() => api.post(`/teams/${team.id}/signals/${signal.id}/cancel`)}
                        onDone={(result) => { notify(result.message); onChange(); }}>
            Cancel signal
          </ActionButton>
        )}
      </div>
    </div>
  );
}

function SignalForm({ team, onChange }) {
  const { meta, notify } = useApp();
  const { busy, errors, run } = useAction();
  const [values, setValues] = useState({ message: '', locationLabel: '', durationMinutes: '30' });

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await run(() => api.post(`/teams/${team.id}/signals`, values));
    if (!result) return;
    notify(result.message);
    setValues({ message: '', locationLabel: '', durationMinutes: '30' });
    onChange();
  }

  return (
    <Section title="Broadcast a signal" icon={<Icon name="wifi_tethering" className="text-secondary" />}>
      <p className="text-body-sm text-on-surface-variant">
        A short-lived invitation for your team to come and meet you right now. It disappears when it expires.
      </p>
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field name="message" label="Message" required maxLength={280} placeholder="e.g. Studying for the quiz – join us!"
               value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} error={errors.message} />
        <Field name="locationLabel" label="Where" required maxLength={150} placeholder="e.g. Library café"
               value={values.locationLabel} onChange={(event) => setValues({ ...values, locationLabel: event.target.value })} error={errors.locationLabel} />
        <RadioGroup name="durationMinutes" legend="Active for" options={meta.SIGNAL_DURATIONS} columns={4}
                    value={values.durationMinutes} onChange={(durationMinutes) => setValues({ ...values, durationMinutes })}
                    error={errors.durationMinutes} />
        <SubmitButton busy={busy} className="btn-violet btn-block"><Icon name="cell_tower" /> Broadcast signal</SubmitButton>
      </form>
    </Section>
  );
}

function Membership({ team, isMember, isOwner, onChange }) {
  const { user, notify } = useApp();
  const pathname = usePathname();
  const done = (result) => {
    notify(result.message);
    onChange();
  };

  return (
    <Section title="Membership" icon={<Icon name="badge" className="text-primary-container" />}>
      {!user ? (
        <Link href={loginUrl(pathname)} className="btn btn-primary btn-block">Log in to join</Link>
      ) : !isMember ? (
        <ActionButton block className="btn-violet" action={() => api.post(`/teams/${team.id}/join`)} onDone={done}>
          Join team
        </ActionButton>
      ) : isOwner ? (
        <div className="space-y-3">
          <Link href={`/teams/${team.id}/edit`} className="btn btn-primary btn-block">Edit team</Link>
          <p className="field-hint">To leave, first make another member the owner (see Members).</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-body-sm text-on-surface-variant">You’re a member of this team.</p>
          <ActionButton block className="btn-danger" action={() => api.post(`/teams/${team.id}/leave`)} onDone={done}
                        confirm={`Leave ${team.name}? Your active signals will be cancelled.`}>
            Leave team
          </ActionButton>
        </div>
      )}
    </Section>
  );
}

function Members({ team, members, isOwner, onChange }) {
  const { user, notify } = useApp();
  const others = members.filter((member) => !member.is_owner);
  const [newOwnerId, setNewOwnerId] = useState(others[0] ? String(others[0].id) : '');

  return (
    <Section title={`Members (${members.length})`} icon={<Icon name="groups" className="text-tertiary-fixed" />}>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar text={initials(member.full_name)} color={member.is_owner ? 'text-secondary' : 'text-primary-container'} />
              <div>
                <p className="text-body-sm font-semibold">{member.full_name}{member.id === user.id && ' (you)'}</p>
                <p className="font-mono text-label-sm text-on-surface-variant">
                  {member.major || 'No major listed'} · joined {formatDateTime(member.joined_at)}
                </p>
              </div>
            </div>
            {Boolean(member.is_owner) && <Chip color="chip-violet">Owner</Chip>}
          </li>
        ))}
      </ul>

      {isOwner && others.length > 0 && (
        <div className="space-y-3 border-t border-white/5 pt-4">
          <Field as="select" name="newOwnerId" label="Transfer ownership to" value={newOwnerId} onChange={(event) => setNewOwnerId(event.target.value)}>
            {others.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}
          </Field>
          <ActionButton block action={() => api.post(`/teams/${team.id}/transfer`, { newOwnerId })}
                        confirm="Make this member the owner? You will become a regular member."
                        onDone={(result) => { notify(result.message); onChange(); }}>
            Make owner
          </ActionButton>
        </div>
      )}
    </Section>
  );
}

function Schedule({ team, sessions }) {
  const [showPast, setShowPast] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-label-md font-bold uppercase tracking-wider text-primary-container">Sessions &amp; events</h2>
        <Link href={`/teams/${team.id}/sessions/new`} className="btn btn-primary"><Icon name="add" /> New session</Link>
      </div>
      {sessions.upcoming.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">No upcoming sessions. Plan one for your team!</p>
      ) : (
        <ul className="space-y-2">
          {sessions.upcoming.map((session) => (
            <li key={session.id} className="panel relative flex items-center justify-between gap-3 hover:bg-surface-container-high">
              <div>
                <Link href={`/teams/${team.id}/sessions/${session.id}`} className="text-body-sm font-semibold after:absolute after:inset-0">
                  {session.title}
                </Link>
                <p className="font-mono text-label-sm text-on-surface-variant">
                  {formatDateTime(session.starts_at)}{session.location_label && ` · ${session.location_label}`}
                </p>
              </div>
              <Chip color="chip-green">Upcoming</Chip>
            </li>
          ))}
        </ul>
      )}
      {sessions.others.length > 0 && (
        <div>
          <button type="button" className="font-mono text-label-md text-on-surface-variant hover:text-on-surface" aria-expanded={showPast}
                  onClick={() => setShowPast(!showPast)}>
            {showPast ? '▾' : '▸'} Past and cancelled ({sessions.others.length})
          </button>
          {showPast && (
            <ul className="mt-2 space-y-2">
              {sessions.others.map((session) => (
                <li key={session.id} className="panel relative flex items-center justify-between gap-3 opacity-80">
                  <div>
                    <Link href={`/teams/${team.id}/sessions/${session.id}`} className="text-body-sm after:absolute after:inset-0">{session.title}</Link>
                    <p className="font-mono text-label-sm text-on-surface-variant">{formatDateTime(session.starts_at)}</p>
                  </div>
                  <Chip color={session.status === 'cancelled' ? 'chip-red' : ''}>{session.status === 'cancelled' ? 'Cancelled' : 'Past'}</Chip>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const { id } = useParams();
  const { data, error, reload } = useApi(`/teams/${id}`);
  useTitle(data ? data.data.name : 'Team');

  if (error) return <main id="main" className="container-page py-10"><ErrorState status={error.status} message={error.message} /></main>;
  if (!data) return <main id="main" className="container-page py-10"><LoadingState /></main>;

  const { data: team, isMember, isOwner, members, sessions, signals } = data;
  return (
    <main id="main" className="container-page space-y-6 py-10">
      <BackLink href="/teams">Back to teams</BackLink>

      {signals.map((signal) => <SignalBanner key={signal.id} team={team} signal={signal} onChange={reload} />)}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <article className="card space-y-5">
            <div className="flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container" aria-hidden="true">
                  <Icon name="hub" className="text-[28px]!" />
                </span>
                <div>
                  <h1 className="text-headline-md font-bold">{team.name}</h1>
                  <p className="font-mono text-label-sm text-on-surface-variant">
                    Owner: {team.owner_name} · created {formatDateTime(team.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip color="chip-violet">{plural(team.member_count, 'member')}</Chip>
                {isOwner ? <Chip color="chip-green">You own this team</Chip> : isMember && <Chip color="chip-green">Member</Chip>}
              </div>
            </div>
            <p className="whitespace-pre-line text-body-md text-on-surface-variant">{team.description}</p>

            {isMember ? (
              <>
                <div className="space-y-2">
                  <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">Member roster</span>
                  <div className="flex flex-wrap gap-2">
                    {members.slice(0, 8).map((member) => (
                      <span key={member.id} title={member.full_name}><Avatar text={initials(member.full_name)} /></span>
                    ))}
                    {members.length > 8 && <Avatar text={`+${members.length - 8}`} color="text-on-surface-variant" />}
                  </div>
                </div>
                <Schedule team={team} sessions={sessions} />
              </>
            ) : (
              <p className="panel text-body-sm text-on-surface-variant">
                Join the team to see its members, sessions and Team Signals.
              </p>
            )}
          </article>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <Membership team={team} isMember={isMember} isOwner={isOwner} onChange={reload} />
          {isMember && <SignalForm team={team} onChange={reload} />}
          {isMember && <Members key={members.length + String(isOwner)} team={team} members={members} isOwner={isOwner} onChange={reload} />}
        </aside>
      </div>
    </main>
  );
}
