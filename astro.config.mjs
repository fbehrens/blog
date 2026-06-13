// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://www.aufb.de',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});