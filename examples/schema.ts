import { makeExecutableSchema } from '@graphql-tools/schema';
import depthLimitDirective, { MemoryCache } from '../src';

// Schema definition
const typeDefs = `
  type Query {
    hello: String @depthLimit(limit: 3)
    deepField: DeepType @depthLimit(limit: 2)
  }

  type Mutation {
    createItem(data: ItemInput!): ItemResponse @depthLimit(limit: 5)
    deepMutation(data: DeepInput!): DeepResponse
  }

  type DeepType {
    name: String
    nested: DeepType
  }

  input ItemInput {
    name: String!
    details: String
  }

  input DeepInput {
    level1: Level1Input
  }

  input Level1Input {
    level2: Level2Input
  }

  input Level2Input {
    level3: Level3Input
  }

  input Level3Input {
    level4: String
  }

  type ItemResponse {
    success: Boolean!
    message: String
  }

  type DeepResponse {
    success: Boolean!
    depth: DeepType
  }
`;

// Resolver definitions
const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    deepField: () => {
      return {
        name: 'Nested field',
        nested: { name: 'Another level', nested: null },
      };
    },
  },
  Mutation: {
    createItem: (
      _: any,
      { data }: { data: { name: string; details?: string } },
    ) => {
      return {
        success: true,
        message: `Item created: ${data.name}`,
      };
    },
    deepMutation: (_: any, { data }: { data: any }) => {
      return {
        success: true,
        depth: 7, // Example value
      };
    },
  },
};

export const initSchema = async () => {
  const depthDirective = depthLimitDirective({
    globalLimit: 5,
    store: new MemoryCache(),
  });

  // Create schema with depth limit directive applied
  const schema = depthDirective.transformer(
    makeExecutableSchema({
      typeDefs: [depthDirective.typeDefs, typeDefs],
      resolvers,
    }),
  );

  console.log('GraphQL Schema with Depth Limit Directive initialized.');

  // Clean up Redis connection on server shutdown
  process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    console.log('Redis connection closed.');
    process.exit(0);
  });

  return schema;
};
