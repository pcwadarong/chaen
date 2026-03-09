import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: false,
  jsxFramework: 'react',
  outdir: 'styled-system',
  strictTokens: true,
  gitignore: false,
  cssVarRoot: ':where(:root, :host)',
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: ['./styled-system/**/*'],
  conditions: {
    extend: {
      dark: '[data-theme="dark"] &',
    },
  },
  theme: {
    extend: {
      tokens: {
        radii: {
          2: { value: '0.5rem' },
          3: { value: '0.75rem' },
          4: { value: '1rem' },
          '2xs': { value: '0.6rem' },
          xs: { value: '0.65rem' },
          s: { value: '0.75rem' },
          m: { value: '0.85rem' },
          l: { value: '1rem' },
          xl: { value: '1.2rem' },
          '2xl': { value: '1.65rem' },
          '3xl': { value: '2rem' },
          pill: { value: '999px' },
          sm: { value: '0.85rem' },
          md: { value: '1.2rem' },
          lg: { value: '1.65rem' },
        },
        fontSizes: {
          12: { value: '0.75rem' },
          14: { value: '0.875rem' },
          16: { value: '1rem' },
          18: { value: '1.125rem' },
          20: { value: '1.25rem' },
          24: { value: '1.5rem' },
          32: { value: '2rem' },
          36: { value: '2.25rem' },
        },
        lineHeights: {
          96: { value: '0.96' },
          98: { value: '0.98' },
          100: { value: '1' },
          110: { value: '1.1' },
          120: { value: '1.2' },
          130: { value: '1.3' },
          140: { value: '1.4' },
          155: { value: '1.55' },
          160: { value: '1.6' },
          170: { value: '1.7' },
          180: { value: '1.8' },
        },
        fontWeights: {
          medium: { value: '500' },
          semibold: { value: '600' },
          bold: { value: '700' },
        },
        fonts: {
          sans: {
            value:
              "var(--font-pretendard), -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Segoe UI', sans-serif",
          },
          sansJa: {
            value:
              "var(--font-pretendard-jp), var(--font-pretendard), -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif",
          },
          mono: {
            value:
              "var(--font-d2coding), 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Liberation Mono', monospace",
          },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            value: {
              base: '{colors.gray.50}',
              dark: '{colors.gray.900}',
            },
          },
          surface: {
            value: {
              base: '{colors.white}',
              dark: '{colors.gray.800}',
            },
          },
          surfaceMuted: {
            value: {
              base: '{colors.gray.100}',
              dark: '{colors.gray.700}',
            },
          },
          surfaceStrong: {
            value: {
              base: '{colors.gray.200}',
              dark: '{colors.gray.600}',
            },
          },
          text: {
            value: {
              base: '{colors.gray.900}',
              dark: '{colors.gray.50}',
            },
          },
          muted: {
            value: {
              base: '{colors.gray.600}',
              dark: '{colors.gray.300}',
            },
          },
          border: {
            value: {
              base: '{colors.gray.500}',
              dark: '{colors.gray.500}',
            },
          },
          primary: {
            value: {
              base: '{colors.blue.500}',
              dark: '{colors.blue.300}',
            },
          },
          primaryContrast: {
            value: {
              base: '{colors.white}',
              dark: '{colors.gray.900}',
            },
          },
          success: {
            value: {
              base: '{colors.green.500}',
              dark: '{colors.green.400}',
            },
          },
          successContrast: {
            value: {
              base: '{colors.white}',
              dark: '{colors.gray.900}',
            },
          },
          error: {
            value: {
              base: '{colors.red.500}',
              dark: '{colors.red.400}',
            },
          },
          errorContrast: {
            value: {
              base: '{colors.white}',
              dark: '{colors.gray.900}',
            },
          },
          danger: {
            value: {
              base: '{colors.red.500}',
              dark: '{colors.red.400}',
            },
          },
        },
      },
    },
  },
});
