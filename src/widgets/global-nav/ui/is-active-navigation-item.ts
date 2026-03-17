/**
 * 현재 경로가 네비게이션 항목의 href에 해당하는지 판단합니다.
 * - 루트(`/`)는 정확히 일치할 때만 활성화합니다.
 * - 그 외 경로는 하위 상세 경로(`/project/slug`)까지 활성화합니다.
 */
export const isActiveNavigationItem = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/';

  return pathname === href || pathname.startsWith(`${href}/`);
};
