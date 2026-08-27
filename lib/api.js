/**
 * api.js — single fetch wrapper.
 * API_BASE from build-time env.
 * Attaches the session JWT, JSON-encodes, unwraps the OpenAI error shape into a thrown ApiError { status, code, message }.
 * One retry with jitter on 502/503/504; never retry 4xx.
 * Timeouts: 15s dashboard, none for streaming.
 */

import { auth } from './auth';

export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message || `API error ${status}`);
    this.name = 'ApiError';
    this.status = Number(status) || 500;
    this.code = code || `ERR_${status}`;
    this.message = message || `HTTP error ${status}`;
    this.details = details;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const DEFAULT_TIMEOUT_MS = 15000; // 15s for dashboard & normal requests
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateJitterDelay(baseMs = 250, jitterMs = 350) {
  return baseMs + Math.floor(Math.random() * jitterMs);
}

/**
 * Normalizes OpenAI error formats and standard HTTP errors
 */
async function parseErrorResponse(response) {
  let data = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }
  }

  if (!data) {
    try {
      const text = await response.text();
      data = { message: text || response.statusText };
    } catch (_) {
      data = { message: response.statusText || `Request failed with status ${response.status}` };
    }
  }

  // OpenAI error format: { error: { message, type, code, param } }
  const code =
    data?.error?.code ||
    data?.code ||
    data?.error?.type ||
    `HTTP_${response.status}`;

  const message =
    data?.error?.message ||
    data?.message ||
    response.statusText ||
    `API request failed with status ${response.status}`;

  return new ApiError(response.status, code, message, data);
}

/**
 * Core request executor with timeout, auth token, 401 refresh, and 502/503/504 jitter retry
 */
async function executeFetch(path, options = {}, state = { retryCount: 0, refreshed: false }) {
  const isStreaming = Boolean(options.stream || options.isStreaming);
  const timeoutMs = isStreaming ? 0 : (options.timeout !== undefined ? options.timeout : DEFAULT_TIMEOUT_MS);

  // Normalize URL
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  // Headers
  const headers = {
    ...(options.headers || {}),
  };

  // Attach session JWT if not already provided
  const token = auth.getToken();
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // JSON encoding
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    body = JSON.stringify(body);
  }

  // Timeout setup via AbortController
  const controller = new AbortController();
  let timeoutId = null;

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  }

  // Chain user-provided AbortSignal if present
  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      controller.abort(options.signal.reason);
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
      signal: controller.signal,
      credentials: options.credentials || 'include',
    });

    if (timeoutId) clearTimeout(timeoutId);

    // If request succeeded (2xx)
    if (response.ok) {
      if (isStreaming) {
        return response;
      }
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    }

    // Handle 401 Unauthorized: one silent refresh attempt then retry
    if (response.status === 401 && !state.refreshed) {
      const refreshResult = await auth.refreshSession();
      if (refreshResult?.token) {
        // Retry the original request once with new token
        return executeFetch(path, options, { retryCount: state.retryCount, refreshed: true });
      }
      // If refresh failed, parse error and throw
      throw await parseErrorResponse(response);
    }

    // Handle 502/503/504: exactly ONE retry with jitter; NEVER retry 4xx
    if (RETRYABLE_STATUS_CODES.has(response.status) && state.retryCount < 1) {
      const jitter = calculateJitterDelay();
      console.warn(`[api] Received ${response.status} from ${url}. Retrying after ${jitter}ms jitter...`);
      await sleep(jitter);
      return executeFetch(path, options, { retryCount: state.retryCount + 1, refreshed: state.refreshed });
    }

    // Un-retried or 4xx/non-retryable error
    throw await parseErrorResponse(response);
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    // Network / abort / timeout error
    if (err.name === 'AbortError') {
      throw new ApiError(408, 'REQUEST_TIMEOUT', err.message || 'Request was aborted or timed out');
    }

    // If network error occurred and we haven't retried yet, retry once with jitter
    if (state.retryCount < 1 && !isStreaming) {
      const jitter = calculateJitterDelay();
      console.warn(`[api] Network error for ${url}. Retrying after ${jitter}ms jitter...`, err.message);
      await sleep(jitter);
      return executeFetch(path, options, { retryCount: state.retryCount + 1, refreshed: state.refreshed });
    }

    throw new ApiError(0, 'NETWORK_ERROR', err.message || 'Network connection error', err);
  }
}

export const api = {
  get(path, options = {}) {
    return executeFetch(path, { ...options, method: 'GET' });
  },

  post(path, body = null, options = {}) {
    return executeFetch(path, { ...options, method: 'POST', body });
  },

  patch(path, body = null, options = {}) {
    return executeFetch(path, { ...options, method: 'PATCH', body });
  },

  put(path, body = null, options = {}) {
    return executeFetch(path, { ...options, method: 'PUT', body });
  },

  delete(path, options = {}) {
    return executeFetch(path, { ...options, method: 'DELETE' });
  },

  request(path, options = {}) {
    return executeFetch(path, options);
  },
};

export default api;
