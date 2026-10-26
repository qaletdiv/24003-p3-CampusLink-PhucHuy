'use client';

// Colored HUD chips for statuses, categories and Lost/Found types.
import { useApp } from '@/components/providers/AppProvider';

// status value -> chip color
const STATUS_COLORS = {
  open: 'chip-green',
  matched: 'chip-violet',
  completed: 'chip-cyan',
  cancelled: 'chip-red',
  pending: 'chip-amber',
  accepted: 'chip-green',
  declined: 'chip-red',
  withdrawn: '',
  closed: '',
  scheduled: 'chip-cyan',
  in_progress: 'chip-violet',
  resolved: 'chip-cyan',
};

// `kind` picks the label map: help | offer | session | lostFound
const LABEL_MAPS = {
  help: 'HELP_REQUEST_STATUSES',
  offer: 'OFFER_STATUSES',
  session: 'SESSION_STATUSES',
  lostFound: 'LOST_FOUND_STATUSES',
};

export function StatusChip({ kind, status }) {
  const { meta } = useApp();
  return <span className={`chip ${STATUS_COLORS[status] || ''}`}>{meta[LABEL_MAPS[kind]][status] || status}</span>;
}

export function LostFoundType({ type }) {
  const { meta } = useApp();
  return (
    <span className={`chip font-bold ${type === 'lost' ? 'chip-red' : 'chip-cyan'}`}>{meta.LOST_FOUND_TYPES[type]}</span>
  );
}

export function Chip({ children, color = '' }) {
  return <span className={`chip ${color}`}>{children}</span>;
}
