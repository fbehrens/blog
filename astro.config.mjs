// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.aufb.de',
  vite: {
    plugins: [tailwindcss()]
  }
});
