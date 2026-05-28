import Fastify, { type FastifyInstance } from 'fastify';

import {
  FlightViewArrivalsService,
  type ArrivalsService,
} from './lib/flightview/service.js';
import { registerArrivalsRoute } from './routes/arrivals.js';
import { registerFaviconRoute } from './routes/favicon.js';
import { registerHomeRoute } from './routes/home.js';

export interface BuildAppOptions {
  arrivalsService?: ArrivalsService;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false,
  });
  const arrivalsService =
    options.arrivalsService ?? new FlightViewArrivalsService();

  app.get('/health', async () => ({
    status: 'ok',
  }));

  registerHomeRoute(app);
  registerFaviconRoute(app);
  registerArrivalsRoute(app, arrivalsService);
  app.addHook('onClose', async () => {
    await arrivalsService.close();
  });

  return app;
}
