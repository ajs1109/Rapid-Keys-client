import Link from 'next/link';
import { Keyboard, LogIn, Swords, UserPlus } from 'lucide-react';
import SinglePlayer from '@/components/singleplayer';

export default function TypingGame() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      <header className="relative z-20 border-b border-white/5 bg-background/95">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg font-headline text-lg font-bold tracking-tight text-on-surface outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Keyboard size={19} aria-hidden="true" />
            </span>
            Rapid Keys
          </Link>

          <nav className="flex items-center gap-0 sm:gap-2" aria-label="Account navigation">
            <Link
              href="/auth?mode=login"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-on-surface-variant outline-none transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-secondary sm:gap-2 sm:px-4"
            >
              <LogIn size={16} aria-hidden="true" />
              <span>Log in</span>
            </Link>
            <Link
              href="/auth?mode=signup"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-on-primary-fixed outline-none transition-colors hover:bg-primary-dim focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4"
            >
              <UserPlus size={16} aria-hidden="true" />
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="mx-auto flex max-w-[1440px] justify-end px-4 pt-4 sm:px-8 lg:px-12">
          <Link
            href="/auth?mode=login&next=multi-player"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-on-surface-variant outline-none transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <Swords size={16} aria-hidden="true" />
            Multiplayer? Log in
          </Link>
        </div>

        <SinglePlayer guestMode />
      </main>
    </div>
  );
}
