import { buildGlobalNavigationItems } from './build-navigation-items';

const labels = {
  articles: 'Articles',
  guest: 'Guest',
  home: 'Home',
  project: 'Project',
  resume: 'Resume',
};

describe('buildGlobalNavigationItems', () => {
  it('일반 사용자에게는 공개 네비게이션만 반환한다', () => {
    expect(buildGlobalNavigationItems({ isAdmin: false, labels })).toEqual([
      { href: '/', label: 'Home' },
      { href: '/resume', label: 'Resume' },
      { href: '/project', label: 'Project' },
      { href: '/articles', label: 'Articles' },
      { href: '/guest', label: 'Guest' },
    ]);
  });

  it('관리자 세션이면 관리자 탭을 마지막에 추가한다', () => {
    expect(buildGlobalNavigationItems({ isAdmin: true, labels }).at(-1)).toEqual({
      href: '/admin',
      label: '관리자',
    });
  });
});
