import { css } from '@emotion/react';

/**
 * 화면에는 숨기고 스크린 리더에는 노출해야 하는 텍스트에 사용하는 공통 스타일입니다.
 */
export const srOnlyStyle = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: var(--space-0);
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
