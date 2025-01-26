import { makeExecutableSchema } from '@graphql-tools/schema';
import { createClient, RedisClientType } from 'redis';
import depthLimitDirective, { RedisCache } from '../src';

// Schema definition
const typeDefs = `
   type Query {
    greeting: String @depthLimit(limit: 3)
    userDetails: User @depthLimit(limit: 2)
    viewer: Viewer @depthLimit(limit: 3)
  }

  type User {
    name: String
    posts: [Post]
  }

  type Viewer {
    users: [User]
  }

  type Post {
    title: String
    comments: [Comment]
  }

  type Comment {
    id: ID
    content: String
    author: String
  }
`;

// Resolver definitions
const resolvers = {
  Query: {
    greeting: () => 'Hello, world!',
    userDetails: () => ({
      name: 'John Doe',
      posts: [
        {
          title: 'Post 1',
          comments: [
            { id: '1', content: 'Great post!', author: 'Alice' },
            { id: '2', content: 'Thanks for sharing!', author: 'Bob' },
          ],
        },
      ],
    }),
    viewer: () => ({
      users: [
        {
          name: 'Jane Smith',
          posts: [
            {
              title: 'Another Post',
              comments: [
                { id: '3', content: 'Nice article!', author: 'Charlie' },
              ],
            },
          ],
        },
      ],
    }),
  },
};

export const initSchema = async () => {
  const redisClient: RedisClientType = createClient({
    url: 'redis://localhost:6379',
  });
  await redisClient.connect();

  const depthDirective = depthLimitDirective({
    globalLimit: 5,
    store: new RedisCache(redisClient),
  });

  // Create schema with depth limit directive applied
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
