import {
  buildDefaultOgImageUrl,
  buildOgImagePath,
  buildOgImageUrl,
  isOgImageType,
  OG_IMAGE_PLACEHOLDER_URL,
} from '@/shared/lib/seo/og-image';

describe('og-image helpers', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('OG 이미지 경로와 절대 URL을 생성한다', () => {
    expect(buildOgImagePath({ id: 'hello world', type: 'article' })).toBe(
      '/api/og/article/hello%20world',
    );
    expect(buildOgImageUrl({ id: 'hello', type: 'project' })).toBe(
      'https://chaen.dev/api/og/project/hello',
    );
  });

  it('지원하는 OG 이미지 타입만 허용한다', () => {
    expect(isOgImageType('article')).toBe(true);
    expect(isOgImageType('project')).toBe(true);
    expect(isOgImageType('guest')).toBe(false);
  });

  it('placeholder 이미지 URL을 노출한다', () => {
    expect(OG_IMAGE_PLACEHOLDER_URL).toBe('/thumbnail.png');
    expect(buildDefaultOgImageUrl()).toBe('https://chaen.dev/thumbnail.png');
  });
});
