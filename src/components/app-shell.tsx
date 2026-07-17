'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Compass, Headphones, Home, Search, ScrollText } from 'lucide-react';
import { KitsuneMark } from './kitsune-mark';
import { MiniPlayer } from './mini-player';
import { usePlayer } from './player-provider';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/player', label: 'Player', icon: Headphones },
  { href: '/logs', label: 'Logs', icon: ScrollText },
  { href: '/fixations', label: 'Fixations', icon: Compass },
  { href: '/search', label: 'Search', icon: Search }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { beat } = usePlayer();
  const isNowPlaying = pathname === '/player/now-playing';

  if (pathname.startsWith('/studio')) return <>{children}</>;

  return (
    <div className="public-app-shell min-h-screen bg-transparent text-[var(--text-primary)]">
      <header className="mx-auto flex min-h-[var(--shell-header-height)] w-full max-w-[var(--shell-max)] items-center px-[var(--page-inset-mobile)] pt-[env(safe-area-inset-top)]" aria-label="Site identity">
        <Link href="/" className="focusable-surface group inline-flex min-h-11 min-w-0 items-center gap-3" aria-label="The Kitsune Protocol, Home">
          <span className="relative grid h-7 w-7 shrink-0 place-items-center border border-[var(--line-subtle)] text-[var(--text-muted)] transition-colors duration-[var(--motion-ui)] group-hover:border-[var(--accent)]" aria-hidden="true">
            <KitsuneMark variant="solid" className="absolute h-4 w-4" />
            <span className="type-numeric text-[9px]">KP</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.8125rem] font-semibold tracking-[0.01em] text-[var(--text-primary)]">The Kitsune Protocol</span>
            <span className="type-metadata mt-0.5 block truncate text-[9px] uppercase tracking-[0.16em]">Personal archive</span>
          </span>
        </Link>
        <span aria-hidden="true" className="ml-auto h-px w-[clamp(2rem,14vw,9rem)] bg-[var(--line-subtle)]" />
      </header>

      <div className={clsx(
        'mx-auto flex min-h-[calc(100vh-var(--shell-header-height))] max-w-[var(--shell-max)] flex-col px-[var(--page-inset-mobile)] pt-4 sm:pt-7',
        beat && !isNowPlaying
          ? 'pb-[calc(var(--bottom-nav-height)+var(--safe-area-bottom)+var(--mini-player-clearance))]'
          : 'pb-[calc(var(--bottom-nav-height)+var(--safe-area-bottom)+2rem)]'
      )}>
        <div className="flex-1">{children}</div>
      </div>

      {isNowPlaying ? null : <MiniPlayer />}

      <nav aria-label="Primary navigation" className="shell-material fixed inset-x-0 bottom-0 z-50 border-t pb-[var(--safe-area-bottom)]">
        <div className="mx-auto grid min-h-[var(--bottom-nav-height)] max-w-xl grid-cols-5 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center type-navigation transition-[color,opacity,background-color] duration-[var(--motion-ui)] ease-[var(--ease-ui)] before:absolute before:inset-x-[28%] before:top-0 before:h-0.5 before:bg-transparent before:content-[""]',
                  isActive
                    ? 'bg-white/[0.025] font-bold text-[var(--text-primary)] before:bg-[var(--accent)]'
                    : 'text-[var(--text-muted)] opacity-80 hover:text-[var(--text-primary)] hover:opacity-100'
                )}
              >
                <Icon aria-hidden="true" className={clsx('h-4 w-4', isActive && 'stroke-[2.2]')} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
