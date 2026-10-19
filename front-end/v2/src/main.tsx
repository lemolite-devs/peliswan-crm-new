import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { useAuthStore } from './stores/authStore';
import { useUiStore } from './stores/uiStore';
import { setUnauthorizedHandler } from './lib/api';
import { resetLookups } from './modules/leads/useLookups';
import './styles/globals.css';

useUiStore.getState().init();
useAuthStore.getState().init();

// Expired / invalid token → back to the sign-in screen.
setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
  resetLookups();
  void router.navigate('/login');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          fontSize: '13px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px -2px rgb(15 23 42 / 0.12)',
        },
      }}
    />
  </React.StrictMode>,
);
