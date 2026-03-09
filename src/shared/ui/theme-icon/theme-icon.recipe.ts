import { css } from 'styled-system/css';

/**
 * 테마 아이콘 프레임의 공통 클래스를 정의합니다.
 */
export const themeIconFrameClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '5',
  height: '5',
  flex: 'none',
  '& > svg': {
    width: 'full',
    height: 'full',
  },
});
