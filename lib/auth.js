/**
 * auth.js — session store.
 * Token in memory + localStorage mirror for reload.
 * On 401, one silent refresh attempt against the cookie-backed refresh route, then redirect to Sign In.
 * Route guard runs before any dashboard component mounts.
 */

const TOKEN_KEY = 'filybase_token';
const USER_KEY = 'filybase_user';

let memoryToken = null;
let memoryUser = null;
let refreshPromise = null;
const listeners = new Set();

function isBrowser() {
  return typeof window !== 'undefined';
}

// Initialize from localStorage in browser environment
function initSessionFromStorage() {
  if (!isBrowser()) return;
  try {
    if (!memoryToken) {
      memoryToken = localStorage.getItem(TOKEN_KEY) || null;
    }
    if (!memoryUser) {
      const rawUser = localStorage.getItem(USER_KEY);
      memoryUser = rawUser ? JSON.parse(rawUser) : null;
    }
  } catch (e) {
    console.error('[auth] Failed to read session from localStorage:', e);
  }
}

initSessionFromStorage();

function notifyListeners() {
  const state = {
    token: memoryToken,
    user: memoryUser,
    isAuthenticated: Boolean(memoryToken),
  };
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error('[auth] Listener error:', e);
    }
  });
}

export const auth = {
  /**
   * Returns current JWT token from memory or localStorage.
   */
  getToken() {
    if (memoryToken) return memoryToken;
    initSessionFromStorage();
    return memoryToken;
  },

  /**
   * Returns current user object.
   */
  getUser() {
    if (memoryUser) return memoryUser;
    initSessionFromStorage();
    return memoryUser;
  },

  /**
   * Check if user is authenticated.
   */
  isAuthenticated() {
    return Boolean(this.getToken());
  },

  /**
   * Save session to memory and localStorage.
   */
  setSession(token, user) {
    memoryToken = token || null;
    memoryUser = user || null;

    if (isBrowser()) {
      try {
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }

        if (user) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(USER_KEY);
        }
      } catch (e) {
        console.error('[auth] Failed to write session to localStorage:', e);
      }
    }

    notifyListeners();
  },

  /**
   * Clears session from memory and localStorage.
   */
  clearSession() {
    this.setSession(null, null);
  },

  /**
   * Subscribe to auth changes.
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribe(callback) {
    listeners.add(callback);
    callback({
      token: this.getToken(),
      user: this.getUser(),
      isAuthenticated: this.isAuthenticated(),
    });
    return () => listeners.delete(callback);
  },

  /**
   * Silent refresh attempt against the cookie-backed refresh route.
   * On 401, exactly one silent refresh is attempted.
   * Deduplicates concurrent refresh attempts with a single promise.
   */
  async refreshSession() {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
      const refreshUrl = `${apiBase}/v1/auth/refresh`;

      try {
        const res = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // transmits HttpOnly refresh cookie
        });

        if (!res.ok) {
          throw new Error(`Refresh failed with status ${res.status}`);
        }

        const data = await res.json();
        const newToken = data.token || data.access_token;
        const newUser = data.user || this.getUser();

        if (!newToken) {
          throw new Error('No token returned in refresh response');
        }

        this.setSession(newToken, newUser);
        return { token: newToken, user: newUser };
      } catch (err) {
        console.warn('[auth] Silent refresh failed, redirecting to Sign In:', err.message);
        this.clearSession();
        this.redirectToSignIn();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  /**
   * Redirect to sign in page on authentication loss.
   */
  redirectToSignIn(returnUrl) {
    if (!isBrowser()) return;
    const currentPath = returnUrl || window.location.pathname;
    // Do not redirect if already on signin or signup pages
    if (currentPath.startsWith('/signin') || currentPath.startsWith('/signup')) {
      return;
    }
    const target = `/signin?from=${encodeURIComponent(currentPath)}`;
    window.location.href = target;
  },

  /**
   * Login helper
   */
  async login(email, password) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
    const res = await fetch(`${apiBase}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      const message = data?.error?.message || data?.message || 'Failed to sign in';
      throw new Error(message);
    }

    const token = data.token || data.access_token;
    const user = data.user || { email, name: email.split('@')[0] };
    this.setSession(token, user);
    return { token, user };
  },

  /**
   * Sign up helper
   */
  async signup(name, email, password) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
    const res = await fetch(`${apiBase}/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      const message = data?.error?.message || data?.message || 'Failed to create account';
      throw new Error(message);
    }

    const token = data.token || data.access_token;
    const user = data.user || { name, email };
    this.setSession(token, user);
    return { token, user };
  },

  /**
   * Logout helper
   */
  async logout() {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
      await fetch(`${apiBase}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    } finally {
      this.clearSession();
      if (isBrowser()) {
        window.location.href = '/signin';
      }
    }
  },
};

export default auth;
