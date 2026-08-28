/**
 * auth.js — client session helper.
 *
 * No token is ever stored in JS. The session lives entirely in httpOnly
 * cookies managed by the /api/v1/auth/* BFF routes. This module just tracks
 * the current user object in memory for rendering.
 */

let currentUser = null;
let resolved = false;
const listeners = new Set();

function emit() {
  for (const cb of listeners) {
    try {
      cb({ user: currentUser, isAuthenticated: Boolean(currentUser) });
    } catch (_) {}
  }
}

async function postJson(path, payload) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const auth = {
  /** Resolve the current user from the server (source of truth). */
  async fetchMe() {
    try {
      const res = await fetch('/api/v1/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        currentUser = null;
      } else {
        const data = await res.json();
        currentUser = data.user || null;
      }
    } catch (_) {
      currentUser = null;
    }
    resolved = true;
    emit();
    return currentUser;
  },

  getUser() {
    return currentUser || { name: '', email: '' };
  },

  isResolved() {
    return resolved;
  },

  isAuthenticated() {
    return Boolean(currentUser);
  },

  async login(email, password) {
    const data = await postJson('/api/v1/auth/login', { email, password });
    currentUser = data.user || null;
    resolved = true;
    emit();
    return data.user;
  },

  async signup(name, email, password) {
    const data = await postJson('/api/v1/auth/signup', { name, email, password });
    currentUser = data.user || null;
    resolved = true;
    emit();
    return data;
  },

  /** Called by api.js when a request comes back 401. */
  async refreshSession() {
    try {
      const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        currentUser = null;
        emit();
        return null;
      }
      const data = await res.json();
      if (data.user) currentUser = data.user;
      return { ok: true, user: currentUser };
    } catch (_) {
      return null;
    }
  },

  subscribe(callback) {
    listeners.add(callback);
    callback({ user: currentUser, isAuthenticated: Boolean(currentUser) });
    return () => listeners.delete(callback);
  },

  redirectToSignIn() {
    if (typeof window !== 'undefined') window.location.href = '/signin';
  },

  async logout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    currentUser = null;
    resolved = true;
    emit();
    if (typeof window !== 'undefined') window.location.href = '/signin';
  },

  // Legacy no-ops kept so existing imports don't break.
  getToken() {
    return null;
  },
  setSession() {},
  clearSession() {},
};

export default auth;
