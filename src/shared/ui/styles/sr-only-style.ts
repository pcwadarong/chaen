import { css } from '@emotion/react';
import type { CSSProperties } from 'react';

/**
 * 화면에는 숨기고 스크린 리더에는 노출해야 하는 텍스트에 사용하는 공통 인라인 스타일입니다.
 */
export const srOnlyStyleObject: CSSProperties = {
  border: 0,
  clip: 'rect(0, 0, 0, 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
};

/**
 * 화면에는 숨기고 스크린 리더에는 노출해야 하는 텍스트에 사용하는 공통 스타일입니다.
 */
export const srOnlyStyle = css`
  position: ${srOnlyStyleObject.position};
  width: ${srOnlyStyleObject.width};
  height: ${srOnlyStyleObject.height};
  padding: 0;
  margin: ${srOnlyStyleObject.margin};
  overflow: ${srOnlyStyleObject.overflow};
  clip: ${srOnlyStyleObject.clip};
  white-space: ${srOnlyStyleObject.whiteSpace};
  border: ${srOnlyStyleObject.border};
`;
