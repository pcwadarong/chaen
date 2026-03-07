import React from 'react';

import styles from '@/widgets/app-frame/app-frame.module.css';

/**
 * 앱 프레임 하단에 공통 저작권 문구를 렌더링합니다.
 */
export const AppFrameFooter = () => (
  <footer className={styles.footer}>
    <small className={styles.footerText}>© 2026.chaewonpark all rights reserved.</small>
  </footer>
);
