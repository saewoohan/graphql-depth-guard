export const typeDefs = `
type Query {
 greeting: String @depthLimit(limit: 3)
 userDetails(id: ID!): User @depthLimit(limit: 2)
 viewer: Viewer @depthLimit(limit: 3)
}

type User {
 id: ID
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
