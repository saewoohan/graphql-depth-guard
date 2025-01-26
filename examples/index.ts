import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { initSchema } from './schema'; // Import the schema initialization

(async () => {
  // Initialize the schema
  const schema = await initSchema();

  // Create Yoga server with the initialized schema
  const yoga = createYoga({ schema });

  // Create HTTP server
  const server = createServer(yoga);

  server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/graphql');
  });
})();
