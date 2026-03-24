'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Droplets, User, Circle } from 'lucide-react';

const tabs = [
  { href: '/hydration', icon: Droplets, label: 'Water', active: true },
  { href: null, icon: Circle, label: '', active: false },
  { href: null, icon: Circle, label: '', active: false },
  { href: null, icon: Circle, label: '', active: false },
  { href: '/profile', icon: User, label: 'Profile', active: true },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 pb-safe"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
        height: '64px',
      }}
    >
      {tabs.map((tab, i) => {
        const isSelected = tab.href && pathname.startsWith(tab.href);
        const Icon = tab.icon;

        if (!tab.active || !tab.href) {
          return (
            <span
              key={i}
              className="flex flex-col items-center justify-center w-14 h-14 opacity-30 cursor-not-allowed"
            >
              <Icon size={22} strokeWidth={1.5} color="#94a3b8" />
            </span>
          );
        }

        return (
          <Link
            key={i}
            href={tab.href}
            className="flex flex-col items-center justify-center w-14 h-14"
          >
            <Icon
              size={22}
              strokeWidth={isSelected ? 2.5 : 1.5}
              color={isSelected ? '#3b82f6' : '#94a3b8'}
            />
          </Link>
        );
      })}
    </nav>
  );
}
