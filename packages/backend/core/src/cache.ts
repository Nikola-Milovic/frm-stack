// ==========================================
// CACHE INTERFACE AND IMPLEMENTATION
// ==========================================

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  cleanup?(): void;
}

export class InMemoryCache implements Cache {
  private cache = new Map<string, { value: unknown; expiry?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const expiry = ttlMs ? Date.now() + ttlMs : undefined;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Cleanup expired entries (can be called periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
