# GraphQL Depth Guard

A GraphQL directive to enforce query depth limits with optional caching support (using Redis or in-memory cache).

## Features

- **Depth Limiting**: Prevent overly deep GraphQL queries.
- **Caching**: Cache depth calculations for performance optimization.
- **Customizable Storage**: Supports Redis, in-memory cache.
- **Flexible Limits**: Apply limits globally or on a per-query basis.

---

## Why GraphQL Depth Guard?

Complexity-based limiters often struggle to precisely identify thresholds for various use cases. This library was created to provide an intuitive mechanism for limiting query depths. By restricting response depth, it aims to:

1. Prevent excessive and repetitive database queries.
2. Simplify configuration compared to complexity-based approaches.
3. Support both global and query-specific limits for better control.

---

## Installation

### NPM

```bash
npm install depth-limit-directive graphql @graphql-tools/utils
```

### Yarn

```bash
yarn add depth-limit-directive graphql @graphql-tools/utils
```

---

## Usage

### Basic Setup

1. **Import the directive and apply it to your schema:**

```ts
import { makeExecutableSchema } from '@graphql-tools/schema';
import depthLimitDirective from 'depth-limit-directive';

const typeDefs = `
  type Query {
    hello: String @depthLimit(limit: 3)
    nestedField: NestedType @depthLimit(limit: 2)
  }

  type NestedType {
    name: String
    child: NestedType
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    nestedField: () => ({ name: 'Level 1', child: { name: 'Level 2' } }),
  },
};

const depthDirective = depthLimitDirective({
  globalLimit: 5, // Optional global limit
});

const schema = depthDirective.transformer(
  makeExecutableSchema({
    typeDefs: [depthDirective.typeDefs, typeDefs],
    resolvers,
  }),
);
```

---

### Caching Support

#### 1. **Using In-Memory Cache**

The library uses an in-memory cache (`MemoryCache`) by default, which stores cached depths for 60 seconds.

```ts
import depthLimitDirective, { MemoryCache } from 'graphql-depth-guard';

const depthDirective = depthLimitDirective({
  globalLimit: 5,
  store: new MemoryCache(60 * 1000),
});
```

#### 2. **Using Redis Cache**

To use Redis for caching:

```ts
import { createClient } from 'redis';
import depthLimitDirective, { RedisCache } from 'graphql-depth-guard';

const redisClient: RedisClientType = createClient({
  url: 'redis://localhost:6379',
});
await redisClient.connect();

const redisCache = new RedisCache(redisClient, 60 * 1000); // TTL: 60 seconds

const depthDirective = depthLimitDirective({
  store: redisCache, // Pass Redis cache instance
  globalLimit: 5,
});
```

#### 3. **Using ioredis Cache**

To use `ioredis` for caching:

```ts
import Redis from 'ioredis';
import depthLimitDirective, { RedisCache } from 'graphql-depth-guard';

const ioredisClient = new Redis('redis://localhost:6379');

const redisCache = new RedisCache(ioredisClient, 60 * 1000); // TTL: 60 seconds

const depthDirective = depthLimitDirective({
  store: redisCache, // Pass Redis cache instance
  globalLimit: 5,
});
```

#### 3. **No Cache**

If no store is provided in the options, caching is disabled, and the directive calculates the depth for every query without caching it.

```ts
const depthDirective = depthLimitDirective({
  globalLimit: 5, // Global limit without caching
});
```

---

### Custom Error Handling

You can provide a custom `errorHandler` to control how errors are reported:

```ts
const depthDirective = depthLimitDirective({
  globalLimit: 5,
  errorHandler: ({ depth, limit, message, isGlobalLimit }) => {
    return new Error(
      `Custom Error: Depth of ${depth} exceeds limit of ${limit}${
        isGlobalLimit ? ' (global limit)' : ''
      }`,
    );
  },
});
```

---

## API

### `depthLimitDirective(options?: DepthLimitDirectiveOptions)`

| Option         | Type                  | Description                                                                |
| -------------- | --------------------- | -------------------------------------------------------------------------- |
| `globalLimit`  | `number` (optional)   | The global depth limit for queries.                                        |
| `errorHandler` | `function` (optional) | Custom function to handle errors when the depth limit is exceeded.         |
| `store`        | `ICache` (optional)   | Cache store implementation (`MemoryCache`, `RedisCache`, or custom store). |

---

## Example Schema with Depth Directive

```graphql
directive @depthLimit(limit: Int!, message: String) on FIELD_DEFINITION

type Query {
  hello: String @depthLimit(limit: 3)
  nestedField: NestedType @depthLimit(limit: 2)
}

type NestedType {
  name: String
  child: NestedType
}
```

---

## Testing

### Running Tests

To ensure your implementation works as expected:

```bash
yarn test
```
