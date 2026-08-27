/**
 * auth.js — session store with Clerk integration
 */

export const auth = {
  getToken() {
    if (typeof window !== 'undefined') {
      try {
        if (window.Clerk?.session) {
          return window.Clerk.session.id || localStorage.getItem('filybase_token');
        }
        return localStorage.getItem('filybase_token');
      } catch (_) {}
    }
    return null;
  },

  async getClerkToken() {
    if (typeof window !== 'undefined' && window.Clerk?.session) {
      try {
        return await window.Clerk.session.getToken();
      } catch (_) {}
    }
    return this.getToken();
  },

  getUser() {
    if (typeof window !== 'undefined' && window.Clerk?.user) {
      const u = window.Clerk.user;
      return {
        id: u.id,
        email: u.primaryEmailAddress?.emailAddress || 'jordan@filybase.ai',
        name: u.fullName || u.firstName || 'Jordan Diaz',
      };
    }
    return { name: 'Jordan Diaz', email: 'jordan@filybase.ai' };
  },

  isAuthenticated() {
    if (typeof window !== 'undefined' && window.Clerk) {
      return Boolean(window.Clerk.user || window.Clerk.session);
    }
    return Boolean(this.getToken());
  },

  setSession(token, user) {
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem('filybase_token', token);
      if (user) localStorage.setItem('filybase_user', JSON.stringify(user));
    }
  },

  clearSession() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('filybase_token');
      localStorage.removeItem('filybase_user');
    }
    if (typeof window !== 'undefined' && window.Clerk?.signOut) {
      window.Clerk.signOut();
    }
  },

  subscribe(callback) {
    if (typeof window !== 'undefined') {
      const check = () => {
        callback({
          token: this.getToken(),
          user: this.getUser(),
          isAuthenticated: this.isAuthenticated(),
        });
      };
      check();
      window.addEventListener('focus', check);
      return () => window.removeEventListener('focus', check);
    }
    callback({ token: null, user: null, isAuthenticated: false });
    return () => {};
  },

  async refreshSession() {
    return { token: this.getToken(), user: this.getUser() };
  },

  redirectToSignIn() {
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
  },

  async logout() {
    this.clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
  },
};

export default auth;
