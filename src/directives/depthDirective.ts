import {
  defaultFieldResolver,
  GraphQLResolveInfo,
  GraphQLError,
  ConstValueNode,
} from 'graphql';
import { mapSchema, MapperKind } from '@graphql-tools/utils';
import { ICache } from '../cache/ICache';
import { generateQueryKey } from '../cache/keyGenerator';
import { calculateDepth } from '../utils/calculateDepth';

export type DepthLimitDirectiveOptions = {
  globalLimit?: number; // Global depth limit
  errorHandler?: (info: {
    depth: number;
    limit: number;
    message?: string;
    isGlobalLimit: boolean;
    info: GraphQLResolveInfo;
  }) => Error; // Error handling callback
  store?: ICache; // Custom store (e.g., RedisStore or MemoryStore)
};

/**
 * Extracts the value from a ConstValueNode.
 * @param node - The ConstValueNode containing the value.
 * @returns The extracted value or null if unsupported.
 */
const getValueFromNode = (node: ConstValueNode): any => {
  if (
    node.kind === 'IntValue' ||
    node.kind === 'FloatValue' ||
    node.kind === 'StringValue' ||
    node.kind === 'BooleanValue' ||
    node.kind === 'EnumValue'
  ) {
    return node.value;
  }

  return null;
};

/**
 * Creates a depth limit directive for GraphQL queries.
 * The directive enforces query depth limits with optional caching for optimization.
 * @param options - Options for configuring the depth limit directive.
 * @returns The GraphQL depth limit directive with the required configuration.
 */
export const depthLimitDirective = (options?: DepthLimitDirectiveOptions) => {
  const cache: ICache | undefined = options?.store;

  /**
   * Calculates the depth of a query with caching based on the entire query.
   * @param info - The GraphQLResolveInfo object.
   * @returns The calculated depth of the query.
   */
  const calculateDepthWithCache = async (
    info: GraphQLResolveInfo,
  ): Promise<number> => {
    if (!cache) {
      return calculateDepth(info);
    }

    // Safely extract the operation name or use 'anonymous'
    const operationName = info.operation.name?.value ?? 'anonymous';

    const queryKey = generateQueryKey(
      operationName,
      info.variableValues,
      info.operation.selectionSet,
    );

    const cachedDepth = await cache.get(queryKey);
    if (cachedDepth !== null) {
      return cachedDepth;
    }

    const depth = calculateDepth(info);

    await cache.set(queryKey, depth);

    return depth;
  };

  return {
    typeDefs: `
      directive @depthLimit(limit: Int!, message: String) on FIELD_DEFINITION
    `,
    transformer: (schema: any) => {
      return mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const originalResolve = fieldConfig.resolve || defaultFieldResolver;

          const directives = fieldConfig.astNode?.directives;

          if (directives) {
            const depthLimitDirective = directives.find(
              (d) => d.name.value === 'depthLimit',
            );
            if (depthLimitDirective) {
              const args = depthLimitDirective.arguments || [];
              const limitArg = args.find((arg) => arg.name.value === 'limit');
              const messageArg = args.find(
                (arg) => arg.name.value === 'message',
              );

              const limitValue = limitArg?.value
                ? getValueFromNode(limitArg.value)
                : null;
              const messageValue = messageArg?.value
                ? getValueFromNode(messageArg.value)
                : null;

              fieldConfig.extensions = {
                ...fieldConfig.extensions,
                depthLimit: {
                  limit: limitValue,
                  message: messageValue,
                },
              };
            }
          }

          fieldConfig.resolve = async function (source, args, context, info) {
            const depth = await calculateDepthWithCache(info);
            const directiveConfig = fieldConfig.extensions?.depthLimit as
              | { limit: number; message?: string }
              | undefined;

            if (directiveConfig) {
              if (depth > directiveConfig.limit) {
                const errorMessage =
                  directiveConfig.message ||
                  `Response depth exceeds limit of ${directiveConfig.limit}`;

                if (options?.errorHandler) {
                  throw options.errorHandler({
                    depth,
                    limit: directiveConfig.limit,
                    message: errorMessage,
                    isGlobalLimit: false,
                    info,
                  });
                }

                throw new GraphQLError(errorMessage, {
                  extensions: {
                    code: 'TOO_MANY_REQUESTS',
                    http: { status: 429 },
                  },
                });
              }
            } else if (options?.globalLimit) {
              if (depth > options.globalLimit) {
                const errorMessage = `Response depth exceeds global limit of ${options.globalLimit}`;

                if (options.errorHandler) {
                  throw options.errorHandler({
                    depth,
                    limit: options.globalLimit,
                    message: errorMessage,
                    isGlobalLimit: true,
                    info,
                  });
                }

                throw new GraphQLError(errorMessage, {
                  extensions: {
                    code: 'TOO_MANY_REQUESTS',
                    http: { status: 429 },
                  },
                });
              }
            }

            return originalResolve.call(this, source, args, context, info);
          };

          return fieldConfig;
        },
      });
    },
  };
};
