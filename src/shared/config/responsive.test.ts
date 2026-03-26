import { describe, expect, it } from 'vitest';

import {
  VIEWPORT_BREAKPOINTS,
  viewportImageSizes,
  viewportMediaQuery,
} from '@/shared/config/responsive';

describe('responsive config', () => {
  it('canonical viewport 구간만 source of truth로 노출한다', () => {
    expect(VIEWPORT_BREAKPOINTS.mobileSmallMax).toBe(480);
    expect(VIEWPORT_BREAKPOINTS.mobileLargeMax).toBe(768);
    expect(VIEWPORT_BREAKPOINTS.tabletMax).toBe(960);
    expect(VIEWPORT_BREAKPOINTS.desktopMin).toBe(961);
    expect(VIEWPORT_BREAKPOINTS.desktopMax).toBe(1280);
  });

  it('canonical breakpoint 값으로부터 공통 media query 문자열을 계산한다', () => {
    expect(viewportMediaQuery.mobileSmallDown).toBe('(max-width: 480px)');
    expect(viewportMediaQuery.mobileLargeUp).toBe('(min-width: 481px)');
    expect(viewportMediaQuery.mobileLargeDown).toBe('(max-width: 768px)');
    expect(viewportMediaQuery.tabletUp).toBe('(min-width: 769px)');
    expect(viewportMediaQuery.tabletDown).toBe('(max-width: 960px)');
    expect(viewportMediaQuery.desktopUp).toBe('(min-width: 961px)');
    expect(viewportMediaQuery.desktopDown).toBe('(max-width: 1280px)');
  });

  it('next/image sizes 문자열도 같은 breakpoint 값을 재사용한다', () => {
    expect(viewportImageSizes.imageSourceField).toBe('(max-width: 480px) 100vw, 480px');
  });
});
