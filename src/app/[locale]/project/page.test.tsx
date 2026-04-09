import { isValidElement } from 'react';
import { vi } from 'vitest';

import ProjectRoute, { generateMetadata } from '@/app/[locale]/project/page';
import { getProjectListPageData } from '@/views/project';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    if (key === 'showcaseTitle') return '프로젝트 아카이브';
    if (key === 'showcaseDescription') {
      return '작업한 프로젝트와 그 안에 쌓인 기록들을 함께 정리합니다.';
    }

    return key;
  }),
}));

vi.mock('@/views/project', () => ({
  getProjectListPageData: vi.fn(async () => ({
    initialCursor: null,
    initialItems: [],
    locale: 'ko',
    portfolioButtonLabel: 'Download portfolio',
    portfolioButtonUnavailableLabel: 'Portfolio unavailable',
  })),
  ProjectListPage: function ProjectListPage() {
    return null;
  },
}));

describe('ProjectRoute', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('프로젝트 목록 뷰 엔트리와 포트폴리오 다운로드 경로를 반환한다', async () => {
    const element = await ProjectRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ProjectListPage');
    expect(getProjectListPageData).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.initialItems).toEqual([]);
    expect(element.props.initialCursor).toBeNull();
    expect(element.props.locale).toBe('ko');
    expect(element.props.portfolioButtonLabel).toBe('Download portfolio');
    expect(element.props.portfolioButtonUnavailableLabel).toBe('Portfolio unavailable');
  });

  it('프로젝트 목록 메타데이터에 placeholder OG 이미지와 alternates를 포함한다', async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({
          locale: 'ko',
        }),
      }),
    ).resolves.toMatchObject({
      alternates: {
        canonical: 'https://chaen.dev/ko/project',
        languages: {
          'x-default': 'https://chaen.dev/en/project',
          en: 'https://chaen.dev/en/project',
          fr: 'https://chaen.dev/fr/project',
          ja: 'https://chaen.dev/ja/project',
          ko: 'https://chaen.dev/ko/project',
        },
      },
      description: '작업한 프로젝트와 그 안에 쌓인 기록들을 함께 정리합니다.',
      openGraph: {
        images: ['https://chaen.dev/thumbnail.png'],
        url: 'https://chaen.dev/ko/project',
      },
      title: '프로젝트 아카이브',
      twitter: {
        images: ['https://chaen.dev/thumbnail.png'],
      },
    });
  });
});
