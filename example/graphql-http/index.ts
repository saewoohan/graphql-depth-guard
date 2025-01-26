import express from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import { schemaWithMemoryCache } from '../schema/schema';

const startServer = async () => {
  const schema = await schemaWithMemoryCache();
  const app = express();

  app.use(
    '/graphql',
    createHandler({
      schema,
    }),
  );

  app.listen(4000, () => {
    console.log(`GraphQL server is running at http://localhost:4000/graphql`);
  });
};

// 비동기 함수 실행
startServer().catch((err) => {
  console.error('Error starting the server:', err);
});
