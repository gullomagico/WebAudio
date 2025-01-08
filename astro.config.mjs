import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    sitemap({
      serialize(item) {
        if (item.url === 'https://cafa.dev/webaudio') return undefined; // remove duplicate index page from sitemap
        item.changefreq = 'monthly';
        item.lastmod = new Date();
        item.priority = 0.8;

        return item;
      },
    }),
  ],
  site: 'https://cafa.dev',
  base: '/webaudio',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
