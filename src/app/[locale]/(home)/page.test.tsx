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

const photoItemsPromise = Promise.resolve([]);

vi.mock('@/views/home', () => ({
  getHomePageData: vi.fn(() => ({
    locale: 'ko',
    photoItemsPromise,
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

  it("locale이 'ko'일 때, HomeRoute는 hero photo를 await하지 않고 promise 그대로 홈 뷰에 넘겨야 한다", async () => {
    const element = await HomeRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('HomePage');
    expect(getHomePageData).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.locale).toBe('ko');
    expect(element.props.photoItemsPromise).toBe(photoItemsPromise);
  });

  it("locale이 'ko'일 때, generateMetadata는 placeholder OG 이미지와 alternates를 포함해야 한다", async () => {
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
          'x-default': 'https://chaen.dev/ko',
          en: 'https://chaen.dev/en',
          fr: 'https://chaen.dev/fr',
          ja: 'https://chaen.dev/ja',
          ko: 'https://chaen.dev/ko',
        },
      },
      description: '홈 설명',
      openGraph: {
        images: ['https://chaen.dev/thumbnail.png'],
        url: 'https://chaen.dev/ko',
      },
      title: '홈',
      twitter: {
        images: ['https://chaen.dev/thumbnail.png'],
      },
    });
  });
});
