import { MemoryCache } from '../src/cache/memCache';
import { RedisCache } from '../src/cache/redisCache';
import Redis from 'ioredis';

describe('Cache Tests', () => {
  describe('MemoryCache Tests', () => {
    let memoryCache: MemoryCache;

    beforeEach(() => {
      memoryCache = new MemoryCache(60 * 1000);
    });

    it('should store and retrieve a value', async () => {
      await memoryCache.set('key1', 123);
      const value = await memoryCache.get('key1');
      expect(value).toBe(123);
    });

    it('should return null for missing keys', async () => {
      const value = await memoryCache.get('nonExistingKey');
      expect(value).toBeNull();
    });

    it('should clear all values', async () => {
      await memoryCache.set('key1', 123);
      await memoryCache.set('key2', 456);
      await memoryCache.clear();
      expect(await memoryCache.get('key1')).toBeNull();
      expect(await memoryCache.get('key2')).toBeNull();
    });

    it('should expire keys after TTL', async () => {
      const shortTTLCache = new MemoryCache(100);
      await shortTTLCache.set('key1', 123);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const value = await shortTTLCache.get('key1');
      expect(value).toBeNull();
    });
  });

  describe('RedisCache Tests', () => {
    let redisClient: Redis;
    let redisCache: RedisCache;

    beforeAll(async () => {
      redisClient = new Redis('redis://localhost:6379');
      redisCache = new RedisCache(redisClient);
    });

    afterAll(async () => {
      await redisClient.quit();
    });

    beforeEach(async () => {
      await redisClient.flushall();
    });

    it('should store and retrieve a value', async () => {
      await redisCache.set('key1', 123);
      const value = await redisCache.get('key1');
      expect(value).toBe(123);
    });

    it('should return null for missing keys', async () => {
      const value = await redisCache.get('nonExistingKey');
      expect(value).toBeNull();
    });

    it('should clear all values', async () => {
      await redisCache.set('key1', 123);
      await redisCache.set('key2', 456);
      await redisCache.clear();
      expect(await redisCache.get('key1')).toBeNull();
      expect(await redisCache.get('key2')).toBeNull();
    });

    it('should expire keys after TTL', async () => {
      const cache = new RedisCache(
        {
          host: 'localhost',
          port: 6379,
        },
        100,
      );

      await cache.set('key1', 123);

      let value = await cache.get('key1');
      expect(value).toBe(123);

      await new Promise((resolve) => setTimeout(resolve, 150));
      value = await cache.get('key1');
      expect(value).toBeNull();

      cache.onDestroy();
    });

    it('should work with URL connection string', async () => {
      const urlCache = new RedisCache('redis://localhost:6379');
      await urlCache.set('key1', 123);
      const value = await urlCache.get('key1');
      expect(value).toBe(123);
      urlCache.onDestroy();
    });

    it('should work with Redis options', async () => {
      const optionsCache = new RedisCache({
        host: 'localhost',
        port: 6379,
      });
      await optionsCache.set('key1', 123);
      const value = await optionsCache.get('key1');
      expect(value).toBe(123);
      optionsCache.onDestroy();
    });
  });
});
