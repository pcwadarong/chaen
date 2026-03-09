import { css, cva } from 'styled-system/css';

export const detailPageShellClass = css({
  display: 'block',
  '@media (min-width: 961px)': {
    display: 'grid',
    gridTemplateColumns: '[minmax(16rem, 20rem) minmax(0, 1fr)]',
    gap: '0',
    flex: '[1 1 auto]',
    minHeight: '0',
    height: 'full',
    overflow: 'hidden',
  },
});

export const detailPageSidebarClass = css({
  display: 'none',
  '@media (min-width: 961px)': {
    display: 'flex',
    minHeight: '0',
    height: 'full',
    borderRight: '[1px solid rgb(var(--color-border) / 0.18)]',
    background: '[rgb(var(--color-surface) / 0.16)]',
  },
});

export const detailPageSidebarViewportClass = css({
  py: '7',
  '@media (min-width: 961px)': {
    flex: '[1 1 auto]',
    minHeight: '0',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  '@media (min-width: 1200px)': {
    py: '8',
  },
});

export const detailPageSidebarListClass = css({
  display: 'grid',
});

export const detailPageSidebarLinkClass = cva({
  base: {
    display: 'grid',
    gap: '2',
    px: '4',
    py: '4',
    borderLeft: '[3px solid transparent]',
    borderBottom: '[1px solid rgb(var(--color-border) / 0.16)]',
    color: 'text',
    transition: '[background-color 160ms ease, border-color 160ms ease]',
    _hover: {
      background: '[rgb(var(--color-surface-muted) / 0.5)]',
    },
    _focusVisible: {
      outline: 'none',
      background: '[rgb(var(--color-surface-muted) / 0.58)]',
      boxShadow: '[inset 0 0 0 2px rgb(var(--color-primary) / 0.16)]',
    },
    '@media (min-width: 1200px)': {
      px: '5',
      py: '5',
    },
  },
  variants: {
    active: {
      true: {
        borderLeftColor: 'primary',
        background: '[rgb(var(--color-surface-strong) / 0.3)]',
      },
    },
  },
});

export const detailPageSidebarMetaRowClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: 'muted',
  fontSize: '12',
});

export const detailPageSidebarTitleClass = css({
  lineClamp: '2',
  fontSize: '20',
  lineHeight: '120',
  letterSpacing: '[-0.03em]',
  color: 'muted',
});

export const detailPageSidebarDescriptionClass = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'muted',
  fontSize: '14',
});

export const detailPageEmptyArchiveClass = css({
  p: '5',
  color: 'muted',
});

export const detailPageContentClass = css({
  display: 'flex',
  flexDirection: 'column',
  pt: '10',
  pb: '24',
  '@media (min-width: 961px)': {
    minWidth: '0',
    minHeight: '0',
    height: 'full',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    pb: '0',
  },
});

export const detailPageHeroClass = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  pb: '10',
  borderBottom: '[1px solid rgb(var(--color-border) / 0.24)]',
  '@media (min-width: 961px)': {
    pb: '12',
  },
});

export const detailPageHeroTextClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  alignItems: 'center',
  textAlign: 'center',
  mb: '8',
  px: '4',
});

export const detailPageTitleClass = css({
  fontSize: '32',
  fontWeight: '[800]',
  lineHeight: '110',
  letterSpacing: '[-0.04em]',
  wordBreak: 'keep-all',
});

export const detailPageDescriptionClass = css({
  color: 'muted',
  fontSize: '16',
  lineHeight: '160',
  wordBreak: 'keep-all',
});

export const detailPageTagWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
});

export const detailPageMetaBarSectionClass = css({
  width: 'full',
  pt: '6',
  pb: '10',
  '@media (min-width: 961px)': {
    pt: '7',
    pb: '12',
  },
});

export const detailPageBodyClass = css({
  width: 'full',
  maxWidth: '[48rem]',
  mx: 'auto',
  px: '4',
  pb: '24',
});

export const detailPageContentSectionClass = css({
  display: 'grid',
  gap: '4',
  '@media (min-width: 961px)': {
    gap: '5',
  },
});

export const detailPageGuestbookCtaWrapClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  mt: '8',
});

export const detailPageGuestbookCtaClass = css({
  appearance: 'none',
  border: '[1px solid transparent]',
  outline: 'none',
  textDecoration: 'none',
  userSelect: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  minHeight: '[2.25rem]',
  px: '3',
  py: '1',
  borderRadius: 'pill',
  background: 'primary',
  color: 'primaryContrast',
  fontSize: '14',
  letterSpacing: '[-0.01em]',
});

export const detailPageGuestbookCtaIconMotionClass = css({
  display: 'inline-flex',
  transition: 'transform',
  '.group:hover &': {
    transform: 'translateY(-2px)',
  },
});

export const detailPageGuestbookCtaIconClass = css({
  transform: '[rotate(45deg)]',
});

export const detailPageBottomSectionClass = css({
  mt: '10',
  '@media (min-width: 961px)': {
    mt: '12',
  },
});
