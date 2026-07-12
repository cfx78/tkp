'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Compass, Headphones, Home, Search, ScrollText } from 'lucide-react';
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

  if (pathname.startsWith('/studio')) {
    return <>{children}</>;
  }

  return (
    <div className="public-app-shell min-h-screen bg-transparent text-[var(--text-primary)]">
      <div className={clsx('mx-auto flex min-h-screen max-w-[var(--shell-max)] flex-col px-[var(--page-inset-mobile)] pt-7 sm:pt-10', beat && !isNowPlaying ? 'pb-[calc(var(--bottom-nav-height)+var(--safe-area-bottom)+8rem)]' : 'pb-28')}>
        <div className="flex-1">{children}</div>
      </div>

      {isNowPlaying ? null : <MiniPlayer />}

      <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line-subtle)] bg-[var(--surface-overlay)] pb-[var(--safe-area-bottom)] shadow-[0_-12px_36px_rgba(0,0,0,0.4)]">
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
                  'relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center type-navigation transition-[color,opacity,transform] duration-[var(--motion-ui)] ease-[var(--ease-ui)] after:absolute after:inset-x-[30%] after:top-0 after:h-px after:bg-transparent after:content-["\"]',
                  isActive
                    ? '-translate-y-px text-[var(--text-primary)] after:bg-[var(--accent)]'
                    : 'text-[var(--text-muted)] opacity-80 hover:text-[var(--text-primary)] hover:opacity-100'
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
