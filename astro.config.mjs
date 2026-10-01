import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gruzmarket77.ru',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    assets: 'assets',
    inlineStylesheets: 'auto'
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7
    })
  ],
  vite: {
    build: {
      cssMinify: 'esbuild'
    }
  }
});
