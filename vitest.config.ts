import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: 'server-only',
        replacement: path.resolve(__dirname, './src/shared/lib/test/server-only.ts'),
      },
      {
        find: /\.svg$/,
        replacement: path.resolve(__dirname, './src/shared/lib/test/svg-component.tsx'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
