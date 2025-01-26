import { makeExecutableSchema } from '@graphql-tools/schema';
import { createClient, RedisClientType } from 'redis';
import depthLimitDirective, { MemoryCache, RedisCache } from '../../src';
import { resolvers } from './resolvers';
import { typeDefs } from './typeDefs';
import Redis from 'ioredis';

export const schemaWithNoCache = async () => {
  const depthDirective = depthLimitDirective({
    globalLimit: 5,
  });
  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Graph Depth Limit initialized.');

  return schema;
};

export const schemaWithMemoryCache = async () => {
  const depthDirective = depthLimitDirective({
    globalLimit: 5,
    store: new MemoryCache(),
  });

  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Graph Depth Limit initialized.');

  return schema;
};

export const schemaWithRedis = async () => {
  const redisClient: RedisClientType = createClient({
    url: 'redis://localhost:6379',
  });
  await redisClient.connect();

  const depthDirective = depthLimitDirective({
    globalLimit: 5,
    store: new RedisCache(redisClient),
  });

  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Graph Depth Limit initialized.');

  // Clean up Redis connection on server shutdown
  process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await redisClient.quit();
    console.log('Redis connection closed.');
    process.exit(0);
  });

  return schema;
};

export const schemaWithIoRedis = async () => {
  const ioredisClient = new Redis('redis://localhost:6379');

  const redisCache = new RedisCache(ioredisClient, 60 * 1000); // TTL: 60 seconds

  const depthDirective = depthLimitDirective({
    store: redisCache,
    globalLimit: 5,
  });

  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Graph Depth Limit initialized.');

  // Clean up Redis connection on server shutdown
  process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await ioredisClient.quit();
    console.log('Redis connection closed.');
    process.exit(0);
  });

  return schema;
};
