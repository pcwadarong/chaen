import { css } from 'styled-system/css';

export const markdownRootClass = css({
  color: 'text',
  fontSize: '16',
  lineHeight: '180',
  '& > * + *': {
    mt: '5',
  },
  '& p': {
    wordBreak: 'keep-all',
  },
  '& ul, & ol': {
    paddingLeft: '[1.25rem]',
  },
  '& li + li': {
    mt: '2',
  },
});

export const markdownLinkClass = css({
  color: 'primary',
  textDecoration: 'underline',
  textDecorationThickness: '[0.08em]',
  textUnderlineOffset: '[0.18em]',
  _focusVisible: {
    outline: '[2px solid rgb(var(--color-primary))]',
    outlineOffset: '[2px]',
  },
});

export const markdownBlockquoteClass = css({
  m: '0',
  px: '5',
  py: '4',
  borderLeft: '[4px solid rgb(var(--color-primary))]',
  borderRadius: '3',
  background: '[rgb(var(--color-surface-muted) / 0.5)]',
  color: 'text',
});

export const markdownInlineCodeClass = css({
  px: '[0.375rem]',
  py: '[0.125rem]',
  borderRadius: '2',
  background: '[rgb(var(--color-surface-muted) / 0.8)]',
  fontFamily: 'mono',
  fontSize: '[0.95em]',
});

export const markdownH1Class = css({
  fontSize: '[clamp(2rem, 4vw, 2.5rem)]',
  lineHeight: '110',
  letterSpacing: '[-0.04em]',
});

export const markdownH2Class = css({
  fontSize: '[clamp(1.5rem, 3vw, 2rem)]',
  lineHeight: '120',
  letterSpacing: '[-0.035em]',
});

export const markdownH3Class = css({
  fontSize: '[clamp(1.25rem, 2.4vw, 1.5rem)]',
  lineHeight: '130',
  letterSpacing: '[-0.03em]',
});

export const markdownCodeBlockFrameClass = css({
  overflow: 'hidden',
  border: '[1px solid rgb(var(--color-border) / 0.32)]',
  borderRadius: '[1rem]',
  background:
    '[linear-gradient(180deg, rgb(17 24 39 / 0.98), rgb(10 15 28 / 0.98)), rgb(10 15 28)]',
  boxShadow: '[0 18px 40px rgb(15 23 42 / 0.16)]',
});

export const markdownCodeBlockHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '[1rem]',
  py: '[0.75rem]',
  borderBottom: '[1px solid rgb(255 255 255 / 0.1)]',
});

export const markdownTrafficLightRowClass = css({
  display: 'inline-flex',
  gap: '[0.45rem]',
});

export const markdownTrafficLightClass = css({
  display: 'block',
  width: '[0.75rem]',
  height: '[0.75rem]',
  borderRadius: 'pill',
});

export const markdownTrafficLightRedClass = css({
  background: '[#ff5f57]',
});

export const markdownTrafficLightYellowClass = css({
  background: '[#febc2e]',
});

export const markdownTrafficLightGreenClass = css({
  background: '[#28c840]',
});

export const markdownCodeBlockLanguageClass = css({
  color: '[rgb(226 232 240 / 0.92)]',
  fontFamily: 'mono',
  fontSize: '12',
  letterSpacing: '[0.08em]',
  textTransform: 'uppercase',
});

export const markdownCodeBlockPreClass = css({
  m: '0',
  overflowX: 'auto',
  p: '[1rem]',
  _focusVisible: {
    outline: '[2px solid rgb(var(--color-primary))]',
    outlineOffset: '[-2px]',
  },
  '& code': {
    display: 'grid',
    fontFamily: 'mono',
    fontSize: '[0.95rem]',
    lineHeight: '[1.7]',
  },
});

export const markdownTableScrollClass = css({
  overflowX: 'auto',
  _focusVisible: {
    outline: '[2px solid rgb(var(--color-primary))]',
    outlineOffset: '[2px]',
  },
});

export const markdownTableClass = css({
  width: 'full',
  minWidth: '[32rem]',
  borderCollapse: 'collapse',
  borderSpacing: '0',
  overflow: 'hidden',
  border: '[1px solid rgb(var(--color-border) / 0.24)]',
  borderRadius: '4',
  '& th, & td': {
    px: '[1rem]',
    py: '[0.85rem]',
    borderBottom: '[1px solid rgb(var(--color-border) / 0.16)]',
    textAlign: 'left',
  },
  '& th': {
    background: '[rgb(var(--color-surface-muted) / 0.72)]',
    fontWeight: '[700]',
  },
  '& tr:last-child td': {
    borderBottom: 'none',
  },
});

export const markdownEmptyTextClass = css({
  color: 'muted',
});
