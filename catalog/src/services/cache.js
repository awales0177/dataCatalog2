class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.cleanupInterval = 60 * 1000; // 1 minute
    this.lastCleanup = Date.now();
    this.maxSize = 1000; // Maximum number of items in cache
  }

  generateKey(endpoint, params = {}) {
    // Use a more efficient key generation
    if (Object.keys(params).length === 0) return endpoint;
    
    // Use a hash function for better performance
    let hash = 0;
    const str = endpoint + JSON.stringify(params);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${endpoint}:${hash}`;
  }

  set(key, data, ttl = this.defaultTTL) {
    // Check if cleanup is needed
    this.checkCleanup();

    // If cache is full, remove oldest items
    if (this.cache.size >= this.maxSize) {
      this.removeOldestItems(Math.floor(this.maxSize * 0.2)); // Remove 20% of items
    }

    const item = {
      data,
      timestamp: Date.now(),
      ttl,
      size: this.estimateSize(data)
    };
    this.cache.set(key, item);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update timestamp for LRU-like behavior
    item.timestamp = now;
    return item.data;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidateByPrefix(prefix) {
    // More efficient prefix invalidation using Set
    const keysToDelete = new Set();
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.add(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear() {
    this.cache.clear();
  }

  // Private methods for cache maintenance
  checkCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanup();
      this.lastCleanup = now;
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  removeOldestItems(count) {
    const items = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);
    
    items.forEach(([key]) => this.cache.delete(key));
  }

  estimateSize(data) {
    // Rough estimation of data size in bytes
    return new Blob([JSON.stringify(data)]).size;
  }

  // Cache statistics
  getStats() {
    let totalSize = 0;
    let itemCount = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const item of this.cache.values()) {
      itemCount++;
      totalSize += item.size;
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      }
    }

    return {
      itemCount,
      totalSize,
      expiredCount,
      maxSize: this.maxSize
    };
  }
}

// Create a singleton instance
const cacheService = new CacheService();
export default cacheService; 