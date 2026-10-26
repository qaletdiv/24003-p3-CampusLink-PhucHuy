'use client';

// The one-time message after an action, styled as a terminal banner.
import { useApp } from '@/components/providers/AppProvider';
import { Icon } from '@/components/ui/Icon';

const STYLES = {
  success: { color: 'text-tertiary-fixed border-tertiary-fixed', icon: 'check_circle', label: 'OK' },
  error: { color: 'text-error border-error', icon: 'error', label: 'ERROR' },
  info: { color: 'text-primary-container border-primary-container', icon: 'info', label: 'INFO' },
};

export function Flash() {
  const { flash, clearFlash } = useApp();
  if (!flash) return null;

  const style = STYLES[flash.type] || STYLES.info;
  return (
    <div className="container-page pt-6">
      <div
        className={`flex items-start gap-3 rounded-md border-l-4 bg-surface-container-low p-4 ${style.color}`}
        role={flash.type === 'error' ? 'alert' : 'status'}
      >
        <Icon name={style.icon} />
        <p className="flex-1 text-body-sm text-on-surface">
          <span className={`mr-2 font-mono text-label-md ${style.color}`}>SYS // {style.label}</span>
          {flash.message}
        </p>
        <button type="button" onClick={clearFlash} className="text-on-surface-variant hover:text-on-surface" aria-label="Dismiss message">
          <Icon name="close" />
        </button>
      </div>
    </div>
  );
}
