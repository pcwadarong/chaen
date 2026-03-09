import React from 'react';

import { appFrameFooterClass, appFrameFooterTextClass } from '@/widgets/app-frame/app-frame.styles';

/**
 * 앱 프레임 하단에 공통 저작권 문구를 렌더링합니다.
 */
export const AppFrameFooter = () => (
  <footer className={appFrameFooterClass}>
    <small className={appFrameFooterTextClass}>© 2026.chaewonpark all rights reserved.</small>
  </footer>
);
