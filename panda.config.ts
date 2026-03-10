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
      },
      semanticTokens: {
        colors: {
          bg: {
            value: {
              base: '{colors.gray.50}',
              _dark: '{colors.gray.900}',
            },
          },
          surface: {
            value: {
              base: '{colors.white}',
              _dark: '{colors.gray.800}',
            },
          },
          surfaceMuted: {
            value: {
              base: '{colors.gray.100}',
              _dark: '{colors.gray.700}',
            },
          },
          surfaceStrong: {
            value: {
              base: '{colors.gray.200}',
              _dark: '{colors.gray.600}',
            },
          },
          text: {
            value: {
              base: '{colors.gray.900}',
              _dark: '{colors.gray.50}',
            },
          },
          muted: {
            value: {
              base: '{colors.gray.500}',
              _dark: '{colors.gray.400}',
            },
          },
          border: {
            value: {
              base: '{colors.gray.300}',
              _dark: '{colors.gray.600}',
            },
          },
          borderStrong: {
            value: {
              base: '{colors.gray.400}',
              _dark: '{colors.gray.500}',
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
              _dark: '{colors.gray.900}',
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
              base: '{colors.gray.100}',
              _dark: '{colors.gray.800}',
            },
          },
          success: {
            value: {
              base: '{colors.green.500}',
              _dark: '{colors.green.400}',
            },
          },
          successContrast: {
            value: {
              base: '{colors.white}',
              _dark: '{colors.gray.900}',
            },
          },
          error: {
            value: {
              base: '{colors.red.500}',
              _dark: '{colors.red.400}',
            },
          },
          errorContrast: {
            value: {
              base: '{colors.white}',
              _dark: '{colors.gray.900}',
            },
          },
          danger: {
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
