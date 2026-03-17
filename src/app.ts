import Fastify, { type FastifyInstance } from 'fastify';

import { loadConfig, type AppConfig } from './config.js';
import {
  AviabilityArrivalsService,
  type ArrivalsService,
} from './lib/aviability/service.js';
import { registerArrivalsRoute } from './routes/arrivals.js';

export interface BuildAppOptions {
  config?: AppConfig;
  arrivalsService?: ArrivalsService;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: false,
  });
  const config = options.config ?? loadConfig(process.env);
  const arrivalsService =
    options.arrivalsService ?? new AviabilityArrivalsService(config);

  app.get('/health', async () => ({
    status: 'ok',
  }));

  registerArrivalsRoute(app, arrivalsService);
  app.addHook('onClose', async () => {
    await arrivalsService.close();
  });

  return app;
}
