import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** Signed-in layout: sidebar + top bar around the current page. */
export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1">
            <div className="mx-auto max-w-[1600px] p-4 sm:p-5 lg:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
