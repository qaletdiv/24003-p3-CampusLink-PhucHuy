// Material Symbols icon (font loaded in app/layout.js). Decorative: hidden from screen readers.
export function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
