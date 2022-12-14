import express from 'express';
import 'reflect-metadata';
import http from 'http';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import cookieParser from 'cookie-parser';

import { GreetingResolver } from './resolvers/greeting';
import { UserResolver } from './resolvers/user';
import dataSource from './config/db';
import { Context } from './types/Context';
import refreshTokenRouter from './routes/refreshTokenRouter';

const main = async () => {
  // load entities, establish db connection, sync schema, etc.
  await dataSource.connect();

  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use('/refresh_token', refreshTokenRouter);

  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      validate: false,
      resolvers: [GreetingResolver, UserResolver],
    }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer: httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground,
    ],
    context: ({ req, res }): Pick<Context, 'req' | 'res'> => ({
      req,
      res,
    }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: { origin: 'http://localhost:3000', credentials: true } });

  const PORT = process.env.PORT || 4000;

  await new Promise((resolve) => httpServer.listen(PORT, resolve as () => void));

  console.log(`Server is running, GraphQL Playground available at http://localhost:${PORT}${apolloServer.graphqlPath}`);
};

main().catch((error) => console.log('ERROR STARTING ERROR', error));
