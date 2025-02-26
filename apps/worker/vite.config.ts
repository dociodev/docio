import adapter from '@hono/vite-dev-server/cloudflare';
import { defineConfig } from 'vite';
import build from '@hono/vite-build/cloudflare-workers';
import tailwindcss from '@tailwindcss/vite';
import honox from 'honox/vite';

export default defineConfig(({ command }) => ({
  ssr: {
    external: command === 'serve' ? ['fast-content-type-parse'] : undefined,
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
