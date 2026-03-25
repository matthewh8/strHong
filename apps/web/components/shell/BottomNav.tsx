'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Droplets, User, FlaskConical, Dumbbell, BarChart2 } from 'lucide-react';

const tabs = [
  { href: '/hydration', icon: Droplets, label: 'Water' },
  { href: null, icon: Dumbbell, label: 'soon' },
  { href: '/supplements', icon: FlaskConical, label: 'Supplements' },
  { href: null, icon: BarChart2, label: 'soon' },
  { href: '/profile', icon: User, label: 'Profile' },
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
        // Coming-soon placeholder tabs
        if (tab.label === 'soon') {
          const Icon = tab.icon!;
          return (
            <span key={i} className="flex flex-col items-center justify-center w-14 h-14" style={{ opacity: 0.25, cursor: 'not-allowed' }}>
              <Icon size={22} strokeWidth={1.5} color="#94a3b8" />
            </span>
          );
        }

        // Normal nav tab
        const Icon = tab.icon!;
        const isSelected = tab.href && pathname.startsWith(tab.href);
        return (
          <Link
            key={i}
            href={tab.href!}
            className="flex flex-col items-center justify-center w-14 h-14"
          >
            <Icon
              size={22}
              strokeWidth={isSelected ? 2.5 : 1.5}
              color={isSelected ? '#0096FF' : '#94a3b8'}
            />
          </Link>
        );
      })}
    </nav>
  );
}
