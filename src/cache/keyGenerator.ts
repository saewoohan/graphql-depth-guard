import crypto from 'crypto';

/**
 * Generates a hashed key for the query using operation name, variables, and selection set.
 * @param info - The GraphQLResolveInfo object.
 * @returns A unique and compact hashed key.
 */
export const generateQueryKey = (
  operationName: string,
  variables: Record<string, any>,
  selectionSet: any,
): string => {
  const rawKey = JSON.stringify({ operationName, variables, selectionSet });

  // Generate a SHA-256 hash of the raw key
  return crypto.createHash('sha256').update(rawKey).digest('hex');
};
