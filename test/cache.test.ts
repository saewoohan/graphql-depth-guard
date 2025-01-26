import { MemoryCache } from '../src/cache/memCache';
import { RedisCache } from '../src/cache/redisCache';
import { createClient, RedisClientType } from 'redis';

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
    let redisClient: RedisClientType;
    let redisCache: RedisCache;

    beforeAll(async () => {
      redisClient = createClient({ url: 'redis://localhost:6379' });
      await redisClient.connect();
      redisCache = new RedisCache(redisClient, 60 * 1000);
    });

    afterAll(async () => {
      await redisClient.quit();
    });

    beforeEach(async () => {
      await redisClient.flushAll();
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
      const shortTTLCache = new RedisCache(redisClient, 100);
      await shortTTLCache.set('key1', 123);

      await new Promise((resolve) => setTimeout(resolve, 50));
      let value = await shortTTLCache.get('key1');
      console.log('50ms: Value:', value);
      expect(value).toBe(123);

      await new Promise((resolve) => setTimeout(resolve, 200));
      value = await shortTTLCache.get('key1');
      console.log('200ms: Value:', value);
      expect(value).toBeNull();
    });
  });
});
