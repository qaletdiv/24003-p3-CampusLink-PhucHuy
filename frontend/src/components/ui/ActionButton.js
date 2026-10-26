'use client';

// A button that calls the API (accept, cancel, join, ...): asks for confirmation if `confirm`
// is set, shows a spinner while sending, then calls onDone(result) on success.
import { useAction } from '@/lib/hooks';

export function ActionButton({ action, confirm, onDone, className = 'btn-muted', block = false, children }) {
  const { busy, run } = useAction();

  async function handleClick() {
    if (confirm && !window.confirm(confirm)) return;
    const result = await run(action);
    if (result !== null && onDone) onDone(result);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
      className={`btn ${className} ${block ? 'btn-block' : ''} ${busy ? 'is-busy' : ''}`}
    >
      {children}
    </button>
  );
}
