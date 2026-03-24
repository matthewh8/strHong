import BottomNav from '@/components/shell/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-svh max-w-[480px] mx-auto relative">
      <main className="flex-1 overflow-hidden">{children}</main>
      <BottomNav />
    </div>
  );
}
