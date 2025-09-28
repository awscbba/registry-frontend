// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'static', // Static build for Amplify compatibility (SSR not supported via S3)
  build: {
    assets: 'assets'
  }
});
