import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { TableSkeleton } from '@/components/ui/skeleton';
import Login from '@/screens/auth/Login';

const LeadsList = lazy(() => import('@/modules/leads/LeadsList'));
const LeadDetail = lazy(() => import('@/modules/leads/LeadDetail'));
const LeadForm = lazy(() => import('@/modules/leads/LeadForm'));

const page = (node: ReactNode) => (
  <Suspense
    fallback={
      <div className="card overflow-hidden">
        <TableSkeleton />
      </div>
    }
  >
    {node}
  </Suspense>
);

// Add a module: create src/modules/<name>/, add its routes here and its
// sidebar entry in src/lib/nav.ts.
export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/leads" replace /> },
      { path: 'leads', element: page(<LeadsList />) },
      { path: 'leads/new', element: page(<LeadForm />) },
      { path: 'leads/:id', element: page(<LeadDetail />) },
      { path: 'leads/:id/edit', element: page(<LeadForm />) },
      { path: '*', element: <Navigate to="/leads" replace /> },
    ],
  },
]);
