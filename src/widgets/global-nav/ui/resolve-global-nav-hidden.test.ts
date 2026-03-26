/**
 * @vitest-environment node
 */

import { resolveGlobalNavHidden } from '@/widgets/global-nav/ui/resolve-global-nav-hidden';

describe('resolveGlobalNavHidden', () => {
  it('현재 스크롤이 헤더 높이 이내라면 네비게이션은 숨김 상태가 되면 안 된다', () => {
    expect(
      resolveGlobalNavHidden({
        currentScrollY: 60,
        headerHeight: 72,
        lastScrollY: 12,
        previousHidden: true,
      }),
    ).toBe(false);
  });

  it('헤더 안전 구간을 지난 뒤 아래로 충분히 스크롤하면 네비게이션은 숨김 상태가 되어야 한다', () => {
    expect(
      resolveGlobalNavHidden({
        currentScrollY: 124,
        headerHeight: 72,
        lastScrollY: 116,
        previousHidden: false,
      }),
    ).toBe(true);
  });

  it('헤더 안전 구간을 지난 뒤 위로 충분히 스크롤하면 네비게이션은 다시 표시되어야 한다', () => {
    expect(
      resolveGlobalNavHidden({
        currentScrollY: 110,
        headerHeight: 72,
        lastScrollY: 118,
        previousHidden: true,
      }),
    ).toBe(false);
  });

  it('임계값보다 작은 스크롤 변화에서는 이전 숨김 상태를 유지해야 한다', () => {
    expect(
      resolveGlobalNavHidden({
        currentScrollY: 114,
        headerHeight: 72,
        lastScrollY: 110,
        previousHidden: true,
      }),
    ).toBe(true);
  });
});
