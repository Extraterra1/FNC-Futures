import { type FastifyInstance } from 'fastify';

import {
  ArrivalsServiceBusyError,
  type ArrivalsService,
} from '../lib/flightview/service.js';
import {
  ARRIVALS_VALIDATION_ERROR_MESSAGE,
  parseArrivalsRequest,
} from '../schemas/arrivals.js';

export function registerArrivalsRoute(
  app: FastifyInstance,
  arrivalsService: ArrivalsService,
): void {
  app.post('/arrivals', async (request, reply) => {
    const parsedRequest = parseArrivalsRequest(request.body);

    if (!parsedRequest.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: ARRIVALS_VALIDATION_ERROR_MESSAGE,
        statusCode: 400,
      });
    }

    try {
      return await arrivalsService.getArrivals(parsedRequest.data);
    } catch (error) {
      if (error instanceof ArrivalsServiceBusyError) {
        return reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Another arrivals batch is already running',
          statusCode: 429,
        });
      }

      throw error;
    }
  });
}
