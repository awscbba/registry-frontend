// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'hybrid', // Hybrid mode - static by default, server for dynamic routes
  adapter: node({
    mode: 'standalone'
  }),
  build: {
    assets: 'assets'
  }
});
