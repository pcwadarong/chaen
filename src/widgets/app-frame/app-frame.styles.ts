import { css } from 'styled-system/css';

export const appFrameRootClass = css({
  minHeight: '[100dvh]',
  '@media (min-width: 961px)': {
    p: '[1.25rem]',
  },
});

export const appFrameClass = css({
  width: 'full',
  minHeight: '[100dvh]',
  mx: 'auto',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  '@media (min-width: 961px)': {
    width: '[min(1280px, calc(100vw - 2.5rem))]',
    height: '[calc(100dvh - 2.5rem)]',
    minHeight: '0',
    overflow: 'hidden',
    border: '[1px solid rgb(var(--color-border) / 0.18)]',
    borderRadius: '[2rem]',
    backgroundColor: '[rgb(var(--color-surface) / 0.4)]',
    boxShadow: '[0 24px 64px rgb(var(--color-black) / 0.12)]',
    backdropFilter: '[blur(24px) saturate(120%)]',
    transform: 'translateZ(0)',
  },
});

export const appFrameScrollViewportClass = css({
  flex: '[1 1 auto]',
  minHeight: '0',
  '@media (min-width: 961px)': {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    scrollbarGutter: 'stable',
    '&:has([data-page-scroll-mode="independent"])': {
      overflowY: 'hidden',
      scrollbarGutter: 'auto',
    },
  },
});

export const appFrameFooterClass = css({
  mt: '6',
  px: '4',
  pt: '3',
  pb: '[max(var(--space-3), env(safe-area-inset-bottom))]',
  '@media (min-width: 961px)': {
    mt: '8',
    px: '5',
    py: '3',
  },
  '.group:has([data-hide-app-frame-footer="true"]) &': {
    display: 'none',
  },
});

export const appFrameFooterTextClass = css({
  display: 'block',
  color: 'muted',
  fontSize: '14',
  lineHeight: '160',
  textAlign: 'center',
});

export const appFrameScrollTopButtonClass = css({
  position: 'fixed',
  right: '[max(1rem, env(safe-area-inset-right))]',
  bottom: '[max(1rem, env(safe-area-inset-bottom))]',
  zIndex: '11',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[3rem]',
  height: '[3rem]',
  border: '[1px solid rgb(var(--color-border) / 0.24)]',
  borderRadius: 'pill',
  background: 'surface',
  color: 'text',
  boxShadow: '[0 18px 32px rgb(var(--color-black) / 0.18)]',
  transition:
    '[transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease]',
  _hover: {
    transform: 'translateY(-2px)',
    borderColor: '[rgb(var(--color-border) / 0.4)]',
    boxShadow: '[0 22px 40px rgb(var(--color-black) / 0.22)]',
  },
  _focusVisible: {
    outline: 'none',
    boxShadow:
      '[0 0 0 3px rgb(var(--color-primary) / 0.2), 0 18px 32px rgb(var(--color-black) / 0.18)]',
  },
  '@media (min-width: 961px)': {
    position: 'absolute',
    right: '[1.25rem]',
    bottom: '[calc(1.25rem + 3rem)]',
  },
});
