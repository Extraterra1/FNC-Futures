import { buildApp } from './app.js';

const DEFAULT_PORT = 3000;

async function start(): Promise<void> {
  const app = buildApp();

  try {
    const port = Number(process.env.PORT ?? DEFAULT_PORT);

    await app.listen({
      host: '0.0.0.0',
      port,
    });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

void start();
