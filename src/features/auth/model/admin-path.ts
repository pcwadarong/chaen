import { resolveActionLocale } from '@/shared/lib/i18n/get-action-translations';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';

type AdminPathSection = 'root' | 'login';

const adminPathnameBySection: Record<AdminPathSection, string> = {
  login: '/admin/login',
  root: '/admin',
};

type BuildAdminPathInput = {
  locale?: string | null;
  section?: AdminPathSection;
};

/**
 * 관리자 관련 내부 경로를 locale prefix가 포함된 형태로 생성합니다.
 */
export const buildAdminPath = ({ locale, section = 'root' }: BuildAdminPathInput): string =>
  buildLocalizedPathname({
    locale: resolveActionLocale(locale),
    pathname: adminPathnameBySection[section],
  });
