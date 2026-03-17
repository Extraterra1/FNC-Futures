import { type FastifyInstance } from 'fastify';

import {
  ARRIVALS_VALIDATION_ERROR_MESSAGE,
  parseArrivalsRequest,
} from '../schemas/arrivals.js';

export async function arrivalsRoute(app: FastifyInstance): Promise<void> {
  app.post('/arrivals', async (request, reply) => {
    const parsedRequest = parseArrivalsRequest(request.body);

    if (!parsedRequest.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: ARRIVALS_VALIDATION_ERROR_MESSAGE,
        statusCode: 400,
      });
    }

    const { airportCode, arrivalDate, flightNumbers } = parsedRequest.data;

    return {
      source: 'aviability',
      airportCode,
      arrivalDate,
      summary: {
        requested: flightNumbers.length,
        resolved: 0,
        failed: 0,
      },
      results: flightNumbers.map((flightNumber) => ({
        flightNumber,
        status: 'pending_lookup',
      })),
    };
  });
}
