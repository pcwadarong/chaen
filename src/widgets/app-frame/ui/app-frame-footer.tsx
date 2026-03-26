import React from 'react';
import { css } from 'styled-system/css';

/**
 * 앱 프레임 하단에 공통 저작권 문구를 렌더링합니다.
 */
export const AppFrameFooter = () => (
  <footer className={appFrameFooterClass}>
    <small className={appFrameFooterTextClass}>© 2026.chaewonpark all rights reserved.</small>
  </footer>
);

const appFrameFooterClass = css({
  mt: '6',
  px: '4',
  pt: '3',
  pb: '[max(var(--spacing-3), env(safe-area-inset-bottom))]',
  '.group:has([data-hide-app-frame-footer="true"]) &': {
    display: 'none',
  },
  _desktopUp: {
    mt: '8',
    px: '5',
    py: '3',
  },
  _tabletDown: {
    '.group:has([data-hide-app-frame-footer-mobile="true"]) &': {
      display: 'none',
    },
  },
});

const appFrameFooterTextClass = css({
  display: 'block',
  color: 'muted',
  fontSize: 'sm',
  lineHeight: 'relaxed',
  textAlign: 'center',
});
