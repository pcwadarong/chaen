import type { MetadataRoute } from 'next';

import { buildAbsoluteSiteUrl } from '@/shared/lib/seo/site-url';

/**
 * 검색엔진 크롤링 규칙을 정의합니다.
 */
const robots = (): MetadataRoute.Robots => ({
  host: buildAbsoluteSiteUrl('/'),
  rules: {
    allow: '/',
    disallow: ['/api/', '/admin/', '/auth/callback/', '/supabase/callback/'],
  },
  sitemap: buildAbsoluteSiteUrl('/sitemap.xml'),
});

export default robots;
