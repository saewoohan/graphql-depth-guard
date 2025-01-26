import { GraphQLResolveInfo, GraphQLError, Kind } from 'graphql';

/**
 * Calculates the depth of a GraphQL query based on its GraphQLResolveInfo.
 * @param info - The GraphQLResolveInfo object containing query details.
 * @returns The depth of the query.
 */
export const calculateDepth = (info: GraphQLResolveInfo): number => {
  /**
   * Traverses a list of selections and calculates the maximum depth.
   * @param selections - The list of selections to traverse.
   * @param fragments - The map of fragment definitions in the query.
   * @param depth - The current depth of traversal.
   * @returns The maximum depth of the selections.
   */
  const traverseSelections = (
    selections: readonly any[],
    fragments: Record<string, any>,
    depth: number,
  ): number =>
    Math.max(
      ...selections.map((selection) =>
        traverseNode(selection, fragments, depth),
      ),
    );

  /**
   * Traverses a single node in the GraphQL query and calculates its depth.
   * @param node - The node to traverse (can be a field, fragment, or operation).
   * @param fragments - The map of fragment definitions in the query.
   * @param depth - The current depth of traversal.
   * @returns The depth of the node.
   * @throws GraphQLError - If the node kind is unsupported or a fragment is missing.
   */
  const traverseNode = (
    node: any,
    fragments: Record<string, any>,
    depth: number,
  ): number => {
    switch (node.kind) {
      case Kind.FIELD: {
        // Ignore introspection fields (starting with "__") or fields without selection sets
        if (/^__/.test(node.name.value) || !node.selectionSet) {
          return depth;
        }
        return traverseSelections(
          node.selectionSet.selections,
          fragments,
          depth + 1,
        );
      }
      case Kind.FRAGMENT_SPREAD: {
        const fragment = fragments[node.name.value];
        if (!fragment) {
          throw new GraphQLError(`Fragment ${node.name.value} not found`);
        }
        return traverseNode(fragment, fragments, depth);
      }
      case Kind.INLINE_FRAGMENT:
      case Kind.FRAGMENT_DEFINITION:
      case Kind.OPERATION_DEFINITION: {
        return traverseSelections(
          node.selectionSet.selections,
          fragments,
          depth,
        );
      }
      default: {
        throw new GraphQLError(`Unsupported node kind: ${node.kind}`);
      }
    }
  };

  // Start depth calculation from the root operation
  return traverseNode(info.operation, info.fragments, 0);
};
