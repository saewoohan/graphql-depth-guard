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

## Depth Definition

Query depth is determined by the structure of the response fields, including nested fields and fragments. Here's how depth is defined:

### Example Queries with Depth Calculation

#### Depth: 0

```graphql
query {
  hello
}
```

#### Depth: 1

```graphql
query {
  userDetails {
    name
  }
}
```

#### Depth: 2 (with nested fields)

```graphql
query {
  userDetails {
    name
    posts {
      title
    }
  }
}
```

#### Depth: 2 (with fragments)

```graphql
fragment postInfo on Post {
  title
  comments {
    content
    author
  }
}

query {
  userDetails {
    posts {
      ...postInfo
    }
  }
}
```

---

### Fragment Behavior

- **Inline Fragments** and **Named Fragments** are fully traversed during depth calculation.
- Fragments do not reset or reduce the depth; they are evaluated as part of the query structure.

#### Example with Nested Fragments

```graphql
fragment commentInfo on Comment {
  content
  author
}

fragment postInfo on Post {
  title
  comments {
    ...commentInfo
  }
}

query {
  viewer {
    users {
      posts {
        ...postInfo
      }
    }
  }
}
```

**Depth Calculation:**

- `viewer` (depth 0)
- `users` (depth 1)
- `posts` (depth 2)
- `postInfo` (depth 3 for `title` and `comments`)
- `commentInfo` (depth 4 for `content` and `author`)

**Total Depth:** 4

---

## Installation

### NPM

```bash
npm install graphql-depth-guard graphql @graphql-tools/utils
```

### Yarn

```bash
yarn add graphql-depth-guard graphql @graphql-tools/utils
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

The library supports multiple ways to configure Redis connectivity:

```ts
import depthLimitDirective, { RedisCache } from 'graphql-depth-guard';
import { Redis } from 'ioredis';

// Option 1: Using a Redis URL
const depthDirectiveWithUrl = depthLimitDirective({
  globalLimit: 5,
  store: new RedisCache('redis://localhost:6379'),
});

// Option 2: Using Redis configuration object
const depthDirectiveWithConfig = depthLimitDirective({
  globalLimit: 5,
  store: new RedisCache({
    host: 'localhost',
    port: 6379,
    password: 'optional-password',
  }),
});

// Option 3: Using an existing Redis client
const redisClient = new Redis();
const depthDirectiveWithClient = depthLimitDirective({
  globalLimit: 5,
  store: new RedisCache(redisClient),
});

// Option 4: Using Redis Cluster
import { Cluster } from 'ioredis';
const cluster = new Cluster([
  { host: 'localhost', port: 6379 },
  { host: 'localhost', port: 6380 },
]);
const depthDirectiveWithCluster = depthLimitDirective({
  globalLimit: 5,
  store: new RedisCache(cluster),
});

// Optional: Customize TTL (default: 60000ms)
const cacheWithCustomTTL = new RedisCache('redis://localhost:6379', 30000);
```

**Note**: When using URL or configuration object options, the Redis connection is managed internally by the RedisCache instance. When using an existing Redis client or cluster, you are responsible for managing the connection lifecycle.

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
