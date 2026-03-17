import { isActiveNavigationItem } from '@/widgets/global-nav/ui/is-active-navigation-item';

describe('isActiveNavigationItem', () => {
  it('루트 경로는 정확히 "/"일 때만 활성화한다', () => {
    expect(isActiveNavigationItem('/', '/')).toBe(true);
    expect(isActiveNavigationItem('/project', '/')).toBe(false);
  });

  it('하위 상세 경로에서도 상위 메뉴를 활성화한다', () => {
    expect(isActiveNavigationItem('/project', '/project')).toBe(true);
    expect(isActiveNavigationItem('/project/alpha', '/project')).toBe(true);
    expect(isActiveNavigationItem('/articles/42', '/project')).toBe(false);
  });
});
