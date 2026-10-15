/**
 * Facebook-style Look-Aside In-Memory Cache with Dogpile/Stampede Protection
 */

class LookAsideCache {
  constructor() {
    this.cache = new Map();
    this.locks = new Set();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data, ttlSeconds = 60) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  async remember(key, ttlSeconds, fetchFn) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    // Stampede lease lock
    if (this.locks.has(key)) {
      await new Promise((res) => setTimeout(res, 40));
      const retried = this.get(key);
      if (retried !== null) return retried;
    }

    this.locks.add(key);
    try {
      const fresh = await fetchFn();
      if (fresh !== undefined && fresh !== null) {
        this.set(key, fresh, ttlSeconds);
      }
      return fresh;
    } finally {
      this.locks.delete(key);
    }
  }
}

const memoryCache = new LookAsideCache();

// Clean up expired items every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.cache) {
    if (now > item.expiry) memoryCache.cache.delete(key);
  }
}, 3 * 60 * 1000);

module.exports = memoryCache;
