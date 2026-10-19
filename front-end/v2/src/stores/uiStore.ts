import { create } from 'zustand';
import { STORAGE_KEYS, readStorage, writeStorage } from '@/lib/storage';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  init: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,

  init: () => {
    const saved = readStorage<Theme | null>(STORAGE_KEYS.theme, null);
    const theme: Theme =
      saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);
    set({ theme, sidebarCollapsed: readStorage(STORAGE_KEYS.sidebarCollapsed, false) });
  },

  toggleTheme: () => {
    const theme: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    writeStorage(STORAGE_KEYS.theme, theme);
    set({ theme });
  },

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    writeStorage(STORAGE_KEYS.sidebarCollapsed, next);
    set({ sidebarCollapsed: next });
  },

  setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
}));
