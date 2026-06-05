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
export const onAuthChange = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };
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

  if (res.status === 401 && auth && retry && refreshToken) {
    if (await tryRefresh()) return raw<T>(path, opts, false);
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

export async function login(email: string, password: string): Promise<UserResponse> {
  const auth = await raw<AuthResponse>('/api/auth/login', { method: 'POST', auth: false, body: { email, password } });
  setSession(auth);
  return auth.user;
}
export async function logout() {
  try { await raw('/api/auth/logout', { method: 'POST', body: { refreshToken } }); } catch { /* ignore */ }
  clearSession();
}
