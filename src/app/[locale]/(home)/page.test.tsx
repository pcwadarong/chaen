import { isValidElement } from 'react';
import { vi } from 'vitest';

import HomeRoute, { generateMetadata } from '@/app/[locale]/(home)/page';
import { getHomePageData } from '@/views/home';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    if (key === 'eyebrow') return '홈';
    if (key === 'description') return '홈 설명';

    return key;
  }),
}));

vi.mock('@/views/home', () => ({
  getHomePageData: vi.fn(async () => ({
    items: [],
  })),
  HomePage: function HomePage() {
    return null;
  },
}));

describe('HomeRoute', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('홈 뷰 엔트리와 프로젝트 미리보기 데이터를 반환한다', async () => {
    const element = await HomeRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('HomePage');
    expect(getHomePageData).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.items).toEqual([]);
  });

  it('홈 메타데이터에 placeholder OG 이미지와 alternates를 포함한다', async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({
          locale: 'ko',
        }),
      }),
    ).resolves.toMatchObject({
      alternates: {
        canonical: 'https://chaen.dev/ko',
        languages: {
          'x-default': 'https://chaen.dev/en',
          en: 'https://chaen.dev/en',
          fr: 'https://chaen.dev/fr',
          ja: 'https://chaen.dev/ja',
          ko: 'https://chaen.dev/ko',
        },
      },
      description: '홈 설명',
      openGraph: {
        images: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200'],
        url: 'https://chaen.dev/ko',
      },
      title: '홈',
      twitter: {
        images: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200'],
      },
    });
  });
});
