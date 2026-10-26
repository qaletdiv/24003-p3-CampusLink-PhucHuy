'use client';

// After a cancelled help session, the request owner reopens or cancels the request.
import { useApp } from '@/components/providers/AppProvider';
import { ActionButton } from '@/components/ui/ActionButton';
import { api } from '@/lib/api';

export function RequestNextStep({ requestId, onDone }) {
  const { notify } = useApp();
  const done = (result) => {
    notify(result.message);
    onDone();
  };

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-on-surface-variant">
        The help session was cancelled. What would you like to do with your request?
      </p>
      <ActionButton block className="btn-primary" action={() => api.post(`/help-requests/${requestId}/reopen`)} onDone={done}>
        Reopen to find another helper
      </ActionButton>
      <ActionButton block className="btn-danger" action={() => api.post(`/help-requests/${requestId}/cancel`)} onDone={done}
                    confirm="Cancel this help request? People will no longer be able to offer help.">
        Cancel the request
      </ActionButton>
    </div>
  );
}
