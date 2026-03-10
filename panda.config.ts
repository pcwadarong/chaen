import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true,
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
        fontSizes: {
          32: { value: '2rem' },
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
        shadows: {
          floating: {
            value: '0 18px 32px rgb(15 23 42 / 0.18)',
          },
        },
      },
      semanticTokens: {
        colors: {
          surface: {
            value: {
              base: '{colors.white}',
              _dark: '{colors.zinc.900}',
            },
          },
          appBackdrop: {
            value: {
              base: '{colors.zinc.50}',
              _dark: '{colors.zinc.950}',
            },
          },
          surfaceMuted: {
            value: {
              base: '{colors.zinc.100}',
              _dark: '{colors.zinc.800}',
            },
          },
          surfaceStrong: {
            value: {
              base: '{colors.zinc.200}',
              _dark: '{colors.zinc.700}',
            },
          },
          text: {
            value: {
              base: '{colors.zinc.900}',
              _dark: '{colors.zinc.50}',
            },
          },
          muted: {
            value: {
              base: '{colors.zinc.500}',
              _dark: '{colors.zinc.400}',
            },
          },
          border: {
            value: {
              base: '{colors.zinc.300}',
              _dark: '{colors.zinc.600}',
            },
          },
          borderStrong: {
            value: {
              base: '{colors.zinc.400}',
              _dark: '{colors.zinc.500}',
            },
          },
          primary: {
            value: {
              base: '{colors.blue.500}',
              _dark: '{colors.blue.300}',
            },
          },
          primarySubtle: {
            value: {
              base: '{colors.blue.50}',
              _dark: '{colors.blue.900}',
            },
          },
          primaryMuted: {
            value: {
              base: '{colors.blue.100}',
              _dark: '{colors.blue.800}',
            },
          },
          primaryContrast: {
            value: {
              base: '{colors.white}',
              _dark: '{colors.zinc.900}',
            },
          },
          focusRing: {
            value: {
              base: '{colors.blue.100}',
              _dark: '{colors.blue.900}',
            },
          },
          textSubtle: {
            value: {
              base: '{colors.zinc.100}',
              _dark: '{colors.zinc.800}',
            },
          },
          success: {
            value: {
              base: '{colors.green.500}',
              _dark: '{colors.green.400}',
            },
          },
          error: {
            value: {
              base: '{colors.red.500}',
              _dark: '{colors.red.400}',
            },
          },
        },
      },
    },
  },
});
