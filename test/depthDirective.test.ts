import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';
import depthLimitDirective, { MemoryCache } from '../src';

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

// Configure the directive
const depthDirective = depthLimitDirective({
  globalLimit: 5,
  store: new MemoryCache(60000),
});

const schema = depthDirective.transformer(
  makeExecutableSchema({
    typeDefs: [depthDirective.typeDefs, typeDefs],
    resolvers,
  }),
);

describe('DepthLimitDirective', () => {
  const createContext = () => ({ _calculatedDepth: null });

  it('should allow queries within the depth limit', async () => {
    const query = `
        query {
          greeting
        }
      `;
    const result = await graphql({
      schema,
      source: query,
      contextValue: createContext(),
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.greeting).toBe('Hello, world!');
  });

  it('should reject queries exceeding the depth limit', async () => {
    const query = `
        query {
          userDetails {
            name
            posts {
              title
              comments {
                content
                author
              }
            }
          }
        }
      `;
    const result = await graphql({
      schema,
      source: query,
      contextValue: createContext(),
    });
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0].message).toContain(
      'Response depth exceeds limit',
    );
  });

  it('should cache depth calculation', async () => {
    const query = `
        query {
          greeting
        }
      `;
    const context = createContext();

    const result1 = await graphql({
      schema,
      source: query,
      contextValue: context,
    });
    expect(result1.errors).toBeUndefined();

    const result2 = await graphql({
      schema,
      source: query,
      contextValue: context,
    });
    expect(result2.errors).toBeUndefined();
  });

  it('should handle inline fragments correctly', async () => {
    const query = `
      query {
        viewer {
          users {
            name
            posts {
              title
            }
          }
        }
      }
    `;
    const result = await graphql({
      schema,
      source: query,
      contextValue: createContext(),
    });
    expect(result.errors).toBeUndefined();
  });

  it('should handle named fragments correctly', async () => {
    const query = `
      query {
        viewer {
          users {
            ...userInfo
          }
        }
      }

      fragment userInfo on User {
        name
        posts {
          title
        }
      }
    `;
    const result = await graphql({
      schema,
      source: query,
      contextValue: createContext(),
    });
    expect(result.errors).toBeUndefined();
  });

  it('should reject queries exceeding the depth limit with fragments', async () => {
    const query = `
      fragment postInfo on Post {
        title
        comments {
          content
          author
        }
      }
  
      query {
        viewer {
          users {
            name
            posts {
              ...postInfo
            }
          }
        }
      }
    `;
    const result = await graphql({
      schema,
      source: query,
      contextValue: createContext(),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0].message).toContain(
      'Response depth exceeds limit',
    );
  });
});
