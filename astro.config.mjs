// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://alenros.github.io',
  base: process.env.CI ? '/obviously-static' : '/',
});
