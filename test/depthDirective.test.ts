import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';
import depthLimitDirective, { MemoryCache } from '../src';

const typeDefs = `
  directive @depthLimit(limit: Int!) on FIELD_DEFINITION

  type Query {
    hello: String @depthLimit(limit: 3)
    deepField: DeepType @depthLimit(limit: 2)
  }

  type DeepType {
    name: String
    nested: DeepType
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    deepField: () => ({
      name: 'Level 1',
      nested: { name: 'Level 2', nested: null },
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
          hello
        }
      `;
    const result = await graphql({
      schema,
      source: query,
      contextValue: createContext(),
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.hello).toBe('Hello, world!');
  });

  it('should reject queries exceeding the depth limit', async () => {
    const query = `
        query {
          deepField {
            name
            nested {
              name
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
          hello
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
});
