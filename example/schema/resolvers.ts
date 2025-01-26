export const resolvers = {
  Query: {
    greeting: () => 'Hello, world!',
    userDetails: (_: any, { id }: any) => ({
      id,
      name: `User ${id}`,
      posts: [
        {
          title: `Post for User ${id}`,
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
          id: '1',
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
