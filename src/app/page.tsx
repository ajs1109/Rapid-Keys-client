import Link from 'next/link';
import { Keyboard, LogIn, Swords, UserPlus } from 'lucide-react';
import SinglePlayer from '@/components/singleplayer';

export default function TypingGame() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(222,142,255,0.10),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(0,238,252,0.08),transparent_30%)]" />

      <header className="relative z-20 border-b border-white/5 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
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

      <main className="relative z-10">
        <section className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-2 pt-7 sm:px-8 sm:pt-9 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="max-w-2xl font-headline text-3xl font-bold tracking-[-0.03em] text-on-surface sm:text-4xl">
              Start typing. The clock starts with you.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Take a free 60-second typing test instantly—no account, setup, or waiting.
            </p>
          </div>
          <Link
            href="/auth?mode=login&next=multi-player"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-1 py-2 text-sm font-semibold text-secondary outline-none transition-colors hover:text-secondary-dim focus-visible:ring-2 focus-visible:ring-secondary md:self-auto"
          >
            <Swords size={17} aria-hidden="true" />
            Want to challenge someone? Log in
          </Link>
        </section>

        <SinglePlayer guestMode />
      </main>
    </div>
  );
}
