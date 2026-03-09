import { css, cva } from 'styled-system/css';

export const pageShellClass = cva({
  base: {
    mx: 'auto',
    px: '4',
    pt: '12',
    pb: '20',
    display: 'grid',
    gap: '5',
  },
  variants: {
    width: {
      compact: {
        width: '[min(820px, 100%)]',
      },
      default: {
        width: '[min(980px, 100%)]',
      },
    },
  },
  defaultVariants: {
    width: 'default',
  },
});

export const pageHeaderClass = css({
  display: 'grid',
  gap: '3',
  pb: '7',
});

export const pageHeaderMetaClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  color: 'muted',
  fontSize: '14',
});

export const pageHeaderHeadlineRowClass = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '4',
  flexWrap: 'wrap',
});

export const pageHeaderTitleClass = css({
  flex: '[1 1 18rem]',
  fontSize: '32',
  lineHeight: '98',
  letterSpacing: '[-0.04em]',
});

export const pageHeaderActionWrapClass = css({
  flex: '[0 0 auto]',
  display: 'inline-flex',
  alignItems: 'center',
});

export const pageHeaderDescriptionClass = css({
  flex: '1',
  color: 'muted',
});

export const pageSectionClass = css({
  display: 'grid',
  gap: '4',
});

export const pageSectionTitleClass = css({
  fontSize: '20',
  lineHeight: '120',
  letterSpacing: '[-0.02em]',
});
