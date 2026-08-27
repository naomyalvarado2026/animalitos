import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { EmergencyBanner } from './EmergencyBanner';

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)]">
      <EmergencyBanner />
      <PublicHeader />
      <main className="flex-1 pt-16" id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
