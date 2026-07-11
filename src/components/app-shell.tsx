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

  if (pathname.startsWith('/studio')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-ink text-mist">
      <div className={clsx('mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-8 sm:px-6 lg:px-8', beat ? 'pb-52' : 'pb-28')}>
        <div className="flex-1">{children}</div>
      </div>

      <MiniPlayer />

      <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-medium tracking-[0.08em] uppercase transition',
                  isActive
                    ? 'bg-white/10 text-white shadow-soft'
                    : 'text-mist/65 hover:bg-white/10 hover:text-white'
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
