import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { AppProvider } from '@/components/providers/AppProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Flash } from '@/components/layout/Flash';
import './globals.css';

// The three typefaces of the design system: headlines, body text, HUD labels
const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'vietnamese'], variable: '--font-space-grotesk' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'vietnamese'], variable: '--font-plus-jakarta' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'vietnamese'], variable: '--font-jetbrains-mono' });

export const metadata = {
  title: 'CampusLink',
  description: 'Ask for help, offer help, join study teams and find lost items on campus.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Icon font used by components/ui/Icon.js. display=block on purpose: with "swap" the icon
            names ("search", "menu", ...) would flash as plain text until the font loads. */}
        {/* This is the root layout, so the font loads on every page (the rule targets the old pages/ router) */}
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&display=block"
        />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <AppProvider>
          <Header />
          <Flash />
          {children}
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
