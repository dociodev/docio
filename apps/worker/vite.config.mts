import devServer from '@hono/vite-dev-server';
import adapter from '@hono/vite-dev-server/cloudflare';
import { defineConfig } from 'vite';
import build from '@hono/vite-build/cloudflare-workers';

export default defineConfig({
  plugins: [
    devServer({
      entry: './src/main.ts',
      adapter,
    }),
    build({
      entry: './src/main.ts',
    }),
  ],
});
