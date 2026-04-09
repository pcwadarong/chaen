import path from 'node:path';

import { configDefaults, coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: /^styled-system\/(.*)$/,
        replacement: path.resolve(__dirname, './styled-system/$1'),
      },
      {
        find: 'server-only',
        replacement: path.resolve(__dirname, './src/shared/lib/test/server-only.ts'),
      },
      {
        find: /\.svg$/,
        replacement: path.resolve(__dirname, './src/shared/lib/test/svg-component.tsx'),
      },
      {
        find: /\.svg\?url$/,
        replacement: path.resolve(__dirname, './src/shared/lib/test/svg-mock-url.ts'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    maxWorkers: 1,
    clearMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    exclude: [...configDefaults.exclude, 'tests/browser/**'],
    coverage: {
      clean: false,
      exclude: [
        ...coverageConfigDefaults.exclude,
        'playwright.config.ts',
        'styled-system/**',
        'tests/browser/**',
        'src/app/[locale]/test/**',
        'src/**/*-e2e-fixture.tsx',
      ],
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
    },
  },
});
