'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabItem {
  href: string;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { href: '/', label: 'Beranda', icon: '🏠' },
  { href: '/peta', label: 'Peta', icon: '🗺' },
  { href: '/buah', label: 'Buah', icon: '🍎' },
  { href: '/kalender', label: 'Kalender', icon: '📅' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100/80 pb-safe">
      {/* Top edge shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-200/60 to-transparent" />

      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-all duration-300"
            >
              {/* Pill background for active item */}
              <div
                className={`absolute inset-x-1 inset-y-1.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-50 opacity-100 scale-100'
                    : 'bg-transparent opacity-0 scale-95'
                }`}
              />

              {/* Active indicator dot above icon */}
              <div
                className={`absolute top-1.5 w-1 h-1 rounded-full bg-primary-500 transition-all duration-300 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
              />

              {/* Icon container */}
              <div
                className={`relative z-10 flex items-center justify-center w-7 h-7 transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              >
                <span className="text-[20px] leading-none">{tab.icon}</span>
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-[10px] font-medium leading-none transition-all duration-300 ${
                  isActive
                    ? 'text-primary-700 font-semibold'
                    : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
