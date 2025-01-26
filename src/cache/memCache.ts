import { ICache } from './ICache';

export class MemoryCache implements ICache {
  private store: Map<string, { value: number; expiresAt: number }> = new Map();
  private ttl: number;

  constructor(ttl?: number) {
    this.ttl = ttl ?? 60000;
  }

  async set(key: string, value: number): Promise<void> {
    const expiresAt = Date.now() + this.ttl;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
