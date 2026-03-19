import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

describe('Vercel Fastify entrypoint', () => {
  test('keeps the shared app builder out of Fastify auto-detected entrypoint names', () => {
    expect(existsSync(resolve(process.cwd(), 'src/app.ts'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/server.ts'))).toBe(true);
  });

  test('has a Vercel entrypoint file that directly imports fastify', () => {
    const serverSource = readFileSync(resolve(process.cwd(), 'src/server.ts'), 'utf8');

    expect(serverSource).toMatch(/from 'fastify'|from "fastify"|import 'fastify'|import "fastify"/);
  });
});
