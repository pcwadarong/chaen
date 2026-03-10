import type { MetadataRoute } from 'next';

import { locales } from '@/i18n/routing';
import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';

/**
 * locale prefix를 포함한 관리자/콜백 차단 경로를 생성합니다.
 */
const buildLocaleScopedDisallowRules = (): string[] =>
  locales.flatMap(locale => [
    `/${locale}/admin`,
    `/${locale}/admin/`,
    `/${locale}/admin/login`,
    `/${locale}/admin/login/`,
    `/${locale}/auth/callback/`,
    `/${locale}/supabase/callback/`,
  ]);

/**
 * Next.js Metadata API 기반으로 검색엔진 크롤링 규칙을 정의합니다.
 */
const robots = (): MetadataRoute.Robots => ({
  host: buildAbsoluteSiteUrl('/'),
  rules: {
    allow: '/',
    disallow: [
      '/api/',
      '/admin',
      '/admin/',
      '/admin/login',
      '/admin/login/',
      '/auth/callback/',
      '/supabase/callback/',
      ...buildLocaleScopedDisallowRules(),
    ],
  },
  sitemap: buildAbsoluteSiteUrl('/sitemap.xml'),
});

export default robots;
