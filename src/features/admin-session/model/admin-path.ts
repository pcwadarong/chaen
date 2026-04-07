import type { AppLocale } from '@/i18n/routing';

type AdminPathSection = 'root' | 'login';

export const ADMIN_LOCALE: AppLocale = 'ko';

const adminPathnameBySection: Record<AdminPathSection, string> = {
  login: '/admin/login',
  root: '/admin',
};

type BuildAdminPathInput = {
  locale?: string | null;
  section?: AdminPathSection;
};

/**
 * 관리자 관련 내부 경로를 locale prefix 없이 생성합니다.
 */
export const buildAdminPath = ({ section = 'root' }: BuildAdminPathInput): string =>
  adminPathnameBySection[section];

/**
 * 관리자 하위 경로를 `/admin` 기준 절대 경로로 정규화합니다.
 */
export const buildAdminSubPath = (pathname = ''): string => {
  if (!pathname || pathname === '/') {
    return adminPathnameBySection.root;
  }

  return pathname.startsWith('/admin') ? pathname : `${adminPathnameBySection.root}${pathname}`;
};
