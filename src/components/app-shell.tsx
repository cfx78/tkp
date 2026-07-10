'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/player', label: 'Player' },
  { href: '/logs', label: 'Logs' },
  { href: '/fixations', label: 'Fixations' },
  { href: '/search', label: 'Search' }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-ink text-mist">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <div className="flex-1">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-ink/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-2 py-2 sm:px-4 lg:px-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-center text-[11px] font-medium tracking-[0.16em] uppercase transition',
                  isActive
                    ? 'bg-white/10 text-white shadow-soft'
                    : 'text-mist/65 hover:bg-white/10 hover:text-white'
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
