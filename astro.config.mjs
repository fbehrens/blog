// @ts-check
import { execSync } from 'node:child_process';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const gitSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return (process.env.GITHUB_SHA ?? 'unknown').slice(0, 7);
  }
})();

const buildTime = new Date().toISOString();

export default defineConfig({
  site: 'https://www.aufb.de',
  vite: {
    plugins: [tailwindcss()],
    define: {
      __GIT_SHA__: JSON.stringify(gitSha),
      __BUILD_TIME__: JSON.stringify(buildTime)
    }
  }
});
