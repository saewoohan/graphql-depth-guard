import { schemaWithIoRedis } from './../schema/schema';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';

const startServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const schema = await schemaWithIoRedis();

  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {}) as unknown as express.RequestHandler,
  );

  httpServer.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
  });
};

startServer().catch((error) => {
  console.error('Error starting the server:', error);
});
