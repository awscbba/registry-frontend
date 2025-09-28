// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  build: {
    assets: 'assets'
  },
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    }
  }
});
