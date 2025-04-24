import { makeExecutableSchema } from '@graphql-tools/schema';
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

export const schemaWithRedisUrl = async () => {
  const cache = new RedisCache('redis://localhost:6379');

  const depthDirective = depthLimitDirective({
    globalLimit: 5,
    store: cache,
  });

  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Graph Depth Limit initialized.');

  // Clean up Redis connection on server shutdown
  process.on('SIGINT', () => {
    console.log('Closing Redis connection...');
    cache.onDestroy();
    console.log('Redis connection closed.');
    process.exit(0);
  });

  return schema;
};

export const schemaWithRedisOptions = async () => {
  const cache = new RedisCache({
    host: 'localhost',
    port: 6379,
  });

  const depthDirective = depthLimitDirective({
    globalLimit: 5,
    store: cache,
  });

  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Graph Depth Limit initialized.');

  // Clean up Redis connection on server shutdown
  process.on('SIGINT', () => {
    console.log('Closing Redis connection...');
    cache.onDestroy();
    console.log('Redis connection closed.');
    process.exit(0);
  });

  return schema;
};

export const schemaWithRedisCluster = async () => {
  const cluster = new Redis.Cluster([
    { host: 'localhost', port: 6379 },
    { host: 'localhost', port: 6380 },
  ]);
  const cache = new RedisCache(cluster);

  const depthDirective = depthLimitDirective({
    globalLimit: 5,
    store: cache,
  });

  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Graph Depth Limit initialized.');

  // Clean up Redis connection on server shutdown
  process.on('SIGINT', () => {
    console.log('Closing Redis connection...');
    cache.onDestroy();
    console.log('Redis connection closed.');
    process.exit(0);
  });

  return schema;
};
