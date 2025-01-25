import { ICache } from './ICache';

export class MemoryCache<T> implements ICache<T> {
  private store: Map<string, { value: T; expiresAt: number }> = new Map();
  private ttl: number;

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  async set(key: string, value: T): Promise<void> {
    const expiresAt = Date.now() + this.ttl;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
