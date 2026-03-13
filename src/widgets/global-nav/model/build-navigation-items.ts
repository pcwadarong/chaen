import type { GlobalNavItem } from '@/widgets/global-nav/model/navigation-item';

type NavigationLabels = {
  admin?: string;
  articles: string;
  guest: string;
  home: string;
  project: string;
  resume: string;
};

type BuildGlobalNavigationItemsInput = {
  isAdmin: boolean;
  labels: NavigationLabels;
};

/**
 * 전역 네비게이션 항목을 현재 세션 상태에 맞춰 구성합니다.
 */
export const buildGlobalNavigationItems = ({
  isAdmin,
  labels,
}: BuildGlobalNavigationItemsInput): readonly GlobalNavItem[] => [
  { href: '/', label: labels.home },
  { href: '/resume', label: labels.resume },
  { href: '/project', label: labels.project },
  { href: '/articles', label: labels.articles },
  { href: '/guest', label: labels.guest },
  ...(isAdmin ? [{ href: '/admin' as const, label: labels.admin ?? '관리자' }] : []),
];
