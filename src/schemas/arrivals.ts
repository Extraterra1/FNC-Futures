import { z } from 'zod';

export const ARRIVALS_VALIDATION_ERROR_MESSAGE = 'Invalid arrivals request';

const flightNumberSchema = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.string().min(1));

const arrivalsRequestSchema = z.object({
  airportCode: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{3}$/)),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  flightNumbers: z.array(flightNumberSchema).min(1).max(20),
});

export type ArrivalsRequest = z.infer<typeof arrivalsRequestSchema>;

export function parseArrivalsRequest(input: unknown) {
  return arrivalsRequestSchema.safeParse(input);
}
