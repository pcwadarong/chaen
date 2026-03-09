import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: false,
  jsxFramework: 'react',
  outdir: 'styled-system',
  strictTokens: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
});
