import { MemoryCache } from './memCache';
import { RedisCache } from './redisCache';
import { ICache } from './ICache';

export type CacheType = 'memory' | 'redis';

export class CacheFactory {
  static create<T>(
    config:
      | { type: 'memory'; options?: { ttl?: number } }
      | {
          type: 'redis';
          options: { ttl?: number; host: string; port: number };
        },
  ): ICache<T> {
    if (config.type === 'redis') {
      const { ttl = 60 * 1000, host, port } = config.options; // Redis 필수 옵션
      return new RedisCache<T>(ttl, host, port);
    }

    const { ttl = 60 * 1000 } = config.options ?? {}; // Memory 옵션 (기본값 포함)
    return new MemoryCache<T>(ttl);
  }
}
