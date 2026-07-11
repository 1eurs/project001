// Central API client. Unwraps the { success, message, data, errorCode } envelope,
// attaches the JWT, and transparently refreshes the access token once on 401.
import type { ApiEnvelope, AuthResponse, UserResponse } from './types';

export class ApiError extends Error {
  errorCode?: string;
  httpStatus: number;
  constructor(message: string, httpStatus: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
  }
}

const ACCESS_KEY = 'cafeqr_access';
const REFRESH_KEY = 'cafeqr_refresh';
const USER_KEY = 'cafeqr_user';

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_KEY);

type Listener = () => void;
const listeners = new Set<Listener>();
export const onAuthChange = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l); }; };
const emit = () => listeners.forEach((l) => l());

// cached so useSyncExternalStore gets a stable snapshot reference
let currentUser: UserResponse | null = (() => {
  const s = localStorage.getItem(USER_KEY);
  return s ? (JSON.parse(s) as UserResponse) : null;
})();
export const getUser = (): UserResponse | null => currentUser;
export const isAuthed = () => !!accessToken;
export const accessTokenValue = () => accessToken; // needed for SSE (?access_token=)

function setSession(auth: AuthResponse) {
  accessToken = auth.accessToken;
  refreshToken = auth.refreshToken;
  currentUser = auth.user;
  localStorage.setItem(ACCESS_KEY, auth.accessToken);
  localStorage.setItem(REFRESH_KEY, auth.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  emit();
}
function clearSession() {
  accessToken = refreshToken = null;
  currentUser = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  emit();
}
function setUser(user: UserResponse) {
  currentUser = user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emit();
}

interface Opts { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal; }

async function raw<T>(path: string, opts: Opts, retry = true): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = opts;
  const res = await fetch(path, {
    method,
    signal,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // An expired/invalid token on an authed request: try one silent refresh, and if that can't
  // recover, clear the session so the app cleanly drops to the login screen (instead of looping 401s).
  if (res.status === 401 && auth && retry) {
    if (refreshToken && (await tryRefresh())) return raw<T>(path, opts, false);
    clearSession();
  }

  let env: ApiEnvelope<T>;
  try { env = (await res.json()) as ApiEnvelope<T>; }
  catch { env = { success: res.ok } as ApiEnvelope<T>; }

  if (!res.ok || env.success === false) {
    throw new ApiError(env.message || res.statusText || 'Request failed', res.status, env.errorCode);
  }
  return env.data as T;
}

/** Seconds until this JWT expires (Infinity when it can't be parsed). */
function jwtSecondsLeft(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp - Date.now() / 1000 : Infinity;
  } catch { return Infinity; }
}

/**
 * Access token safe to open a long-lived stream with. EventSource bakes the token into its
 * URL and can't change it on auto-reconnect, so callers must rebuild the URL through this —
 * it refreshes first whenever the current token is expired or about to be.
 */
export async function freshStreamToken(): Promise<string | null> {
  if (accessToken && jwtSecondsLeft(accessToken) > 120) return accessToken;
  if (refreshToken) await tryRefresh();
  return accessToken;
}

let refreshing: Promise<boolean> | null = null;
function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const env = (await res.json()) as ApiEnvelope<AuthResponse>;
      if (env.success && env.data) { setSession(env.data); return true; }
      return false;
    } catch { return false; }
    finally { refreshing = null; }
  })();
  return refreshing;
}

declare global {
  interface Window { __menuPrime?: { url: string; res: Promise<Response> } }
}

/**
 * One-shot pickup of the menu fetch the inline script in index.html started before the
 * bundle loaded. Returns null when there's nothing primed (or it's for another URL);
 * a failed primer falls back to a normal request rather than surfacing a flaky first hit.
 */
export function consumePrimedMenu<T>(path: string): Promise<T> | null {
  const prime = window.__menuPrime;
  if (!prime || prime.url !== path) return null;
  window.__menuPrime = undefined;
  return (async () => {
    let res: Response;
    try { res = await prime.res; }
    catch { return raw<T>(path, { auth: false }); }
    let env: ApiEnvelope<T>;
    try { env = (await res.json()) as ApiEnvelope<T>; }
    catch { env = { success: res.ok } as ApiEnvelope<T>; }
    if (!res.ok || env.success === false) {
      throw new ApiError(env.message || res.statusText || 'Request failed', res.status, env.errorCode);
    }
    return env.data as T;
  })();
}

export const api = {
  get: <T>(p: string, o: Omit<Opts, 'method' | 'body'> = {}) => raw<T>(p, { ...o, method: 'GET' }),
  post: <T>(p: string, body?: unknown, o: Omit<Opts, 'method' | 'body'> = {}) => raw<T>(p, { ...o, method: 'POST', body }),
  patch: <T>(p: string, body?: unknown, o: Omit<Opts, 'method' | 'body'> = {}) => raw<T>(p, { ...o, method: 'PATCH', body }),
  del: <T>(p: string, o: Omit<Opts, 'method' | 'body'> = {}) => raw<T>(p, { ...o, method: 'DELETE' }),
};

/** Multipart upload (returns { url }). Retries once after a token refresh on 401. */
export async function upload<T = { url: string }>(path: string, file: File, retry = true): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(path, {
    method: 'POST',
    headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: fd,
  });
  if (res.status === 401 && retry && refreshToken && (await tryRefresh())) return upload<T>(path, file, false);
  let env: ApiEnvelope<T>;
  try { env = (await res.json()) as ApiEnvelope<T>; } catch { env = { success: res.ok } as ApiEnvelope<T>; }
  if (!res.ok || env.success === false) throw new ApiError(env.message || 'Upload failed', res.status, env.errorCode);
  return env.data as T;
}

/**
 * Re-syncs the signed-in user with the server (permissions, branch, profile). Permissions
 * are claims baked into the access token at issue time, so when they changed since login a
 * plain /me fetch would update the UI but leave API calls carrying the old claims — in that
 * case force a token refresh so the new token (and its user snapshot) match the DB.
 */
export async function syncUser(): Promise<void> {
  if (!accessToken) return;
  try {
    const fresh = await raw<UserResponse>('/api/auth/me', { method: 'GET' });
    const sorted = (u: UserResponse) => [...(u.permissions ?? [])].sort().join(',');
    const changed = !currentUser
      || sorted(fresh) !== sorted(currentUser)
      || fresh.branchId !== currentUser.branchId;
    if (changed && refreshToken) await tryRefresh();
    else setUser(fresh);
  } catch { /* offline or session expired — the normal 401 path handles it */ }
}

export async function login(username: string, password: string): Promise<UserResponse> {
  const auth = await raw<AuthResponse>('/api/auth/login', { method: 'POST', auth: false, body: { username, password } });
  setSession(auth);
  return auth.user;
}
export async function changeEmail(currentPassword: string, newEmail: string): Promise<UserResponse> {
  const auth = await raw<AuthResponse>('/api/auth/change-email', {
    method: 'POST',
    body: { currentPassword, newEmail },
  });
  setSession(auth);
  return auth.user;
}
export async function updateProfile(fullName: string, phone?: string | null): Promise<UserResponse> {
  const user = await raw<UserResponse>('/api/auth/me', {
    method: 'PATCH',
    body: { fullName, phone },
  });
  setUser(user);
  return user;
}
export async function logout() {
  try { await raw('/api/auth/logout', { method: 'POST', body: { refreshToken } }); } catch { /* ignore */ }
  clearSession();
}
