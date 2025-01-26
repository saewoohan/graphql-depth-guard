import { ICache } from './ICache';
import { RedisClientType } from 'redis';
import { Redis as IORedisClient } from 'ioredis';

type RedisClient = RedisClientType | IORedisClient;

export class RedisCache implements ICache {
  private readonly client: RedisClient;
  private readonly keyPrefix: string = 'gql-depth-guard::';
  private readonly ttl: number;

  constructor(client: RedisClient, ttl?: number) {
    this.client = client;
    this.ttl = ttl ?? 60000;
  }

  async set(key: string, value: number): Promise<void> {
    const fullKey = this.generateKey(key);
    const serializedValue = JSON.stringify(value);

    if (this.isIORedisClient()) {
      await (this.client as IORedisClient).set(
        fullKey,
        serializedValue,
        'PX',
        this.ttl,
      );
    } else {
      await (this.client as RedisClientType).set(fullKey, serializedValue, {
        PX: this.ttl,
      });
    }
  }

  async get(key: string): Promise<number | null> {
    const fullKey = this.generateKey(key);
    let serializedValue: string | null;

    if (this.isIORedisClient()) {
      serializedValue = await (this.client as IORedisClient).get(fullKey);
    } else {
      serializedValue = await (this.client as RedisClientType).get(fullKey);
    }

    if (serializedValue === null) return null;
    return JSON.parse(serializedValue) as number;
  }

  async clear(): Promise<void> {
    if (this.isIORedisClient()) {
      await (this.client as IORedisClient).flushall();
    } else {
      await (this.client as RedisClientType).flushAll();
    }
  }

  private generateKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Checks if the client is an ioredis client.
   * @returns True if the client is ioredis, otherwise false.
   */
  private isIORedisClient(): boolean {
    return (
      typeof (this.client as IORedisClient).set === 'function' &&
      typeof (this.client as IORedisClient).get === 'function' &&
      typeof (this.client as IORedisClient).flushall === 'function'
    );
  }
}
