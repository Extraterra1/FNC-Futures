import Fastify, { type FastifyInstance } from 'fastify';

import { arrivalsRoute } from './routes/arrivals.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  app.get('/health', async () => ({
    status: 'ok',
  }));

  app.register(arrivalsRoute);

  return app;
}
