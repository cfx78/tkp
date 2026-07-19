'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Compass, Headphones, Home, Search, ScrollText } from 'lucide-react';
import { KitsuneMark } from './kitsune-mark';
import { BrandWordmark } from './brand-wordmark';
import { EditorialDisplayTitle } from './editorial-display-title';
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

  if (pathname.startsWith('/studio') || pathname === '/offline' || pathname === '/pwa-diagnostics') return <>{children}</>;

  return (
    <div className="public-app-shell min-h-screen bg-transparent text-[var(--text-primary)]">
      <header className="mx-auto flex min-h-[var(--shell-header-height)] w-full max-w-[var(--shell-max)] items-center px-[var(--page-inset-mobile)] pt-[env(safe-area-inset-top)]" aria-label="Site identity">
        <Link href="/" className="focusable-surface group inline-flex min-h-11 min-w-0 max-w-[calc(100%-2.5rem)] items-center gap-2.5" aria-label="The Kitsune Protocol, Home">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center text-[var(--text-primary)]" aria-hidden="true">
            <KitsuneMark className="h-7 w-7" />
          </span>
          <span className="min-w-0 overflow-visible">
            <BrandWordmark variant="compact" />
            <EditorialDisplayTitle variant="subtitle" className="brand-lockup-subtitle">Personal Archive</EditorialDisplayTitle>
          </span>
        </Link>
        <span aria-hidden="true" className="ml-auto h-px min-w-4 flex-1 bg-[var(--line-subtle)]" />
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
