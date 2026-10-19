// Runtime settings, read from `.env` (see `.env.example`).
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:9001';

// Optional. When set, modules not yet on v2 link to the classic UI at this
// address. Leave it empty (as in production) and those links are hidden.
export const V1_URL = ((import.meta.env.VITE_V1_URL as string | undefined) ?? '').replace(/\/$/, '');

// Same cookie name v1 uses, so a sign-in on one version is shared with the
// other while both run on the same host.
export const TOKEN_COOKIE = 'peliswan_sales_crm_token';
