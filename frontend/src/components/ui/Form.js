'use client';

// Accessible form building blocks. Inputs use id="field-<name>", errors id="error-<name>",
// so the error summary can link to each field and screen readers announce the message.
import { useEffect, useRef } from 'react';

const invalidProps = (name, error, hintId) => {
  const describedBy = [hintId, error ? `error-${name}` : null].filter(Boolean).join(' ') || undefined;
  return { 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy };
};

export function FieldError({ name, error }) {
  if (!error) return null;
  return (
    <p className="field-error" id={`error-${name}`}>
      {error}
    </p>
  );
}

function Label({ name, label, optional }) {
  return (
    <label htmlFor={`field-${name}`} className="field-label">
      {label} {optional && <span className="text-outline">({optional})</span>}
    </label>
  );
}

// <input> / <textarea> / <select> with label, hint and error.
export function Field({ name, label, optional, hint, error, as = 'input', children, className = '', ...props }) {
  const hintId = hint ? `hint-${name}` : null;
  const Control = as;
  return (
    <div className={className}>
      <Label name={name} label={label} optional={optional} />
      <Control id={`field-${name}`} name={name} className="input" {...invalidProps(name, error, hintId)} {...props}>
        {children}
      </Control>
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      <FieldError name={name} error={error} />
    </div>
  );
}

// <select> options from a { value: label } map, e.g. meta.HELP_CATEGORIES.
export function Options({ map, placeholder }) {
  return (
    <>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {Object.entries(map).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  );
}

// A group of radio "pills".
export function RadioGroup({ name, legend, options, value, onChange, error, columns = 2 }) {
  return (
    <fieldset id={`field-${name}`} aria-describedby={error ? `error-${name}` : undefined}>
      <legend className="field-label">{legend}</legend>
      <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
        {Object.entries(options).map(([optionValue, label]) => (
          <label key={optionValue} className="choice">
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
            />
            {label}
          </label>
        ))}
      </div>
      <FieldError name={name} error={error} />
    </fieldset>
  );
}

export function Checkbox({ name, checked, onChange, error, children }) {
  return (
    <div>
      <label htmlFor={`field-${name}`} className="choice items-start">
        <input
          id={`field-${name}`}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5"
          {...invalidProps(name, error)}
        />
        <span className="font-body text-body-sm normal-case">{children}</span>
      </label>
      <FieldError name={name} error={error} />
    </div>
  );
}

// Lists all form errors at the top, each linking to its field. Focus moves here after a failed submit.
export function ErrorSummary({ errors }) {
  const ref = useRef(null);
  const entries = Object.entries(errors || {});

  useEffect(() => {
    if (entries.length > 0 && ref.current) ref.current.focus();
  }, [errors]); // eslint-disable-line react-hooks/exhaustive-deps

  if (entries.length === 0) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="mb-6 rounded-md border border-error/50 bg-error-container/25 p-4">
      <p className="font-mono text-label-md uppercase text-error">Please fix the following:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#field-${field}`} className="text-error underline">
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SubmitButton({ busy, children, className = 'btn-primary' }) {
  return (
    <button type="submit" className={`btn ${className} ${busy ? 'is-busy' : ''}`} disabled={busy} aria-busy={busy}>
      {children}
    </button>
  );
}
