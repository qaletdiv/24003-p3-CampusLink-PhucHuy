import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-surface-container-lowest py-10">
      <div className="container-page flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-2">
          <p className="font-headline text-headline-sm font-bold uppercase text-primary">CampusLink</p>
          <p className="text-body-sm text-on-surface-variant">
            A platform that helps students connect, support each other and organize study activities on campus.
          </p>
        </div>
        <ul className="flex flex-wrap gap-4 font-mono text-label-md text-on-surface-variant">
          <li><Link href="/help" className="hover:text-primary-container">Find Help</Link></li>
          <li><Link href="/teams" className="hover:text-primary-container">Study Teams</Link></li>
          <li><Link href="/lost-found" className="hover:text-primary-container">Lost &amp; Found</Link></li>
        </ul>
      </div>
      <p className="container-page mt-8 font-mono text-label-sm text-outline">
        © {new Date().getFullYear()} CampusLink. Your email and phone number are never made public without your consent.
      </p>
    </footer>
  );
}
