/**
 * store.js — tiny cache.
 * get(key, fetcher, ttl) keyed per endpoint.
 * Models catalog TTL 5 min, usage TTL 30s, endpoints TTL 10s.
 * Prevents four components on one page from firing the same request.
 */

export const TTL = {
  MODELS: 5 * 60 * 1000,    // 5 minutes (300,000 ms)
  USAGE: 30 * 1000,         // 30 seconds (30,000 ms)
  ENDPOINTS: 10 * 1000,     // 10 seconds (10,000 ms)
  BILLING: 30 * 1000,       // 30 seconds (30,000 ms)
  DEFAULT: 15 * 1000,       // 15 seconds
};

class StoreCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Determine default TTL based on endpoint path key if not specified
   */
  resolveTTL(key, customTTL) {
    if (typeof customTTL === 'number') return customTTL;
    if (key.includes('/v1/models')) return TTL.MODELS;
    if (key.includes('/v1/usage')) return TTL.USAGE;
    if (key.includes('/v1/endpoints')) return TTL.ENDPOINTS;
    if (key.includes('/v1/billing')) return TTL.BILLING;
    return TTL.DEFAULT;
  }

  /**
   * Get cached data or execute fetcher with deduplication and TTL expiration
   * @param {string} key - Cache key (e.g. endpoint path)
   * @param {Function} fetcher - Async function returning data
   * @param {number} [ttl] - Time to live in ms
   * @param {boolean} [forceRefresh=false] - Ignore cache and re-fetch
   */
  async get(key, fetcher, ttl = null, forceRefresh = false) {
    const effectiveTTL = this.resolveTTL(key, ttl);
    const now = Date.now();
    const entry = this.cache.get(key);

    // If cache entry is fresh and not forcing refresh
    if (!forceRefresh && entry) {
      if (entry.data !== undefined && now < entry.expiresAt) {
        return entry.data;
      }
      // If a request is already in-flight for this key, deduplicate!
      if (entry.promise) {
        return await entry.promise;
      }
    }

    if (!fetcher || typeof fetcher !== 'function') {
      return entry?.data !== undefined ? entry.data : null;
    }

    // Launch in-flight promise
    const fetchPromise = (async () => {
      try {
        const data = await fetcher();
        this.cache.set(key, {
          data,
          expiresAt: Date.now() + effectiveTTL,
          promise: null,
        });
        return data;
      } catch (err) {
        // Remove failed promise from cache so future attempts can retry
        this.cache.delete(key);
        throw err;
      }
    })();

    // Store in-flight promise
    this.cache.set(key, {
      data: entry?.data,
      expiresAt: entry?.expiresAt || 0,
      promise: fetchPromise,
    });

    return await fetchPromise;
  }

  /**
   * Set cached data directly
   */
  set(key, data, ttl = null) {
    const effectiveTTL = this.resolveTTL(key, ttl);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + effectiveTTL,
      promise: null,
    });
  }

  /**
   * Peek cached data without triggering a fetch
   */
  peek(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) return undefined;
    return entry.data;
  }

  /**
   * Invalidate a single key
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix (e.g. '/v1/endpoints')
   */
  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate by regex or predicate
   */
  invalidateFilter(predicate) {
    for (const key of this.cache.keys()) {
      if (predicate(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }
}

export const store = new StoreCache();
export default store;
