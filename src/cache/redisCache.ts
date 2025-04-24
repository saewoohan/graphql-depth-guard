import { ICache } from './ICache';
import { Redis, Cluster, RedisOptions } from 'ioredis';

type RedisClient = Redis | Cluster;

export class RedisCache implements ICache {
  private readonly client: RedisClient;
  private readonly keyPrefix: string = 'gql-depth-guard::';
  private readonly ttl: number;
  private readonly disconnectRequired: boolean;

  constructor(client: Redis);
  constructor(cluster: Cluster);
  constructor(options: RedisOptions);
  constructor(url: string);
  constructor(redisOrOptions?: Redis | Cluster | RedisOptions | string) {
    if (redisOrOptions instanceof Redis || redisOrOptions instanceof Cluster) {
      // Instance injected from outside, lifecycle should be managed externally
      this.client = redisOrOptions;
      this.disconnectRequired = false;
    } else if (typeof redisOrOptions === 'string') {
      // New Redis instance created internally, lifecycle managed by RedisCache
      this.client = new Redis(redisOrOptions);
      this.disconnectRequired = true;
    } else {
      // New Redis instance created internally, lifecycle managed by RedisCache
      this.client = new Redis(redisOrOptions as RedisOptions);
      this.disconnectRequired = true;
    }
    this.ttl = 60000;
  }

  async set(key: string, value: number): Promise<void> {
    const fullKey = this.generateKey(key);
    const serializedValue = JSON.stringify(value);

    await this.client.set(fullKey, serializedValue, 'PX', this.ttl);
  }

  async get(key: string): Promise<number | null> {
    const fullKey = this.generateKey(key);
    const serializedValue = await this.client.get(fullKey);

    if (serializedValue === null) return null;
    return JSON.parse(serializedValue) as number;
  }

  async clear(): Promise<void> {
    await this.client.flushall();
  }

  /**
   * Disconnects from Redis if the connection was created by this instance
   */
  onDestroy(): void {
    if (this.disconnectRequired) {
      this.client.disconnect();
    }
  }

  private generateKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
