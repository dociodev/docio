import adapter from '@hono/vite-dev-server/cloudflare';
import { defineConfig } from 'vite';
import build from '@hono/vite-build/cloudflare-workers';
import tailwindcss from '@tailwindcss/vite';
import honox from 'honox/vite';
import { join } from 'node:path';

export default defineConfig(({ command }) => ({
  resolve: {
    alias: [
      {
        find: '@docio/octo',
        replacement: join(process.cwd(), '../../packages/octo/mod.ts'),
      },
      {
        find: '@docio/db',
        replacement: join(process.cwd(), '../../packages/db/mod.ts'),
      },
    ],
  },
  ssr: {
    external: command === 'serve'
      ? ['fast-content-type-parse', '@prisma/client']
      : undefined,
  },
  plugins: [
    honox({
      devServer: { adapter },
      client: { input: ['./app/style.css'] },
    }),
    tailwindcss() as any,
    build(),
  ],
}));
