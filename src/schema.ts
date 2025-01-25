import { makeExecutableSchema } from '@graphql-tools/schema';
import { depthLimitDirective } from './depthDirective';

// Schema definition
const typeDefs = `
  type Query {
    hello: String @depthLimit(limit: 3)
    deepField: DeepType @depthLimit(limit: 2)
  }

  type Mutation {
    createItem(data: ItemInput!): ItemResponse @depthLimit(limit: 5)
    deepMutation(data: DeepInput!): DeepResponse @depthLimit(limit: 2)
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

// Depth limit directive configuration
const depthDirective = depthLimitDirective({
  globalLimit: 6, // Global depth limit
});

// Schema creation and transformation
export const schema = depthDirective.transformer(
  makeExecutableSchema({
    typeDefs: [depthDirective.typeDefs, typeDefs],
    resolvers,
  }),
);
