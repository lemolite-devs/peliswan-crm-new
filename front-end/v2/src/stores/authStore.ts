import { create } from 'zustand';
import { api, apiErrorMessage } from '@/lib/api';
import { TOKEN_COOKIE } from '@/lib/config';
import {
  STORAGE_KEYS,
  deleteCookie,
  getCookie,
  readStorage,
  removeStorage,
  setCookie,
  writeStorage,
} from '@/lib/storage';

/** The user object returned by POST /api/login (back-end/routes/authRoutes.js). */
export interface SessionUser {
  id: string;
  userID: string;
  name: string;
  email: string;
  role: string; // 'Admin' | 'Sales Manager' | 'Sales Executive' | …
  permissions: string[]; // e.g. 'Leads:view', 'Leads:add', …
}

interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

interface AuthState {
  user: SessionUser | null;
  init: () => void;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  can: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  init: () => {
    const token = getCookie(TOKEN_COOKIE);
    const saved = readStorage<SessionUser | null>(STORAGE_KEYS.user, null);
    set({ user: token && saved ? saved : null });
  },

  login: async (identifier, password) => {
    try {
      const { data } = await api.post<LoginResponse>('/api/login', { identifier, password });
      setCookie(TOKEN_COOKIE, data.accessToken, 6); // token itself expires in 6 days
      writeStorage(STORAGE_KEYS.user, data.user);
      set({ user: data.user });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: apiErrorMessage(err, 'Login failed') };
    }
  },

  logout: () => {
    deleteCookie(TOKEN_COOKIE);
    removeStorage(STORAGE_KEYS.user);
    set({ user: null });
  },

  can: (permission) => get().user?.permissions?.includes(permission) ?? false,
}));
