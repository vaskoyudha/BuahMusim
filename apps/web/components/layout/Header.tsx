'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Beranda' },
  { href: '/peta', label: 'Peta' },
  { href: '/buah', label: 'Buah' },
  { href: '/kalender', label: 'Kalender' },
  { href: '/kota', label: 'Kota' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-400/0 via-primary-500/60 to-primary-400/0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* Icon badge */}
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:shadow-md transition-shadow duration-300"
              style={{ background: 'var(--gradient-tropical)' }}
            >
              🍎
            </div>
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: 'var(--shadow-glow-green)' }} />
          </div>

          {/* Wordmark */}
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              <span className="text-primary-700">Buah</span>
              <span className="font-medium text-gray-600">Musim</span>
            </span>
            {/* Tagline — desktop only */}
            <span className="hidden sm:block text-[9px] font-medium tracking-wide text-gray-400 uppercase mt-0.5">
              Analisis Harga Buah Indonesia
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {/* Hover background for inactive */}
                {!isActive && (
                  <span className="absolute inset-0 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}

                {/* Sliding underline for inactive hover */}
                {!isActive && (
                  <span className="absolute bottom-1 left-4 right-4 h-[1.5px] bg-primary-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
                )}

                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
