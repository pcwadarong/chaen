import { isValidElement } from 'react';
import { vi } from 'vitest';

import ProjectDetailRoute, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/project/[id]/page';
import { getProjectStaticSeedParams } from '@/entities/project/api/detail/get-project-static-seed-params';
import { getProjectDetailArchivePageData, getProjectDetailShellData } from '@/views/project';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

vi.mock('@/entities/project/api/detail/get-project-static-seed-params', () => ({
  getProjectStaticSeedParams: vi.fn(async () => []),
}));

vi.mock('@/views/project', () => ({
  getProjectDetailShellData: vi.fn(async () => ({
    item: null,
    resolvedLocale: null,
  })),
  getProjectDetailArchivePageData: vi.fn(async () => ({
    items: [],
    nextCursor: null,
  })),
  ProjectDetailPage: function ProjectDetailPage() {
    return null;
  },
}));

describe('ProjectDetailRoute', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://chaen.dev';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it('상세 slug는 대표 경로만 seed한다', async () => {
    vi.mocked(getProjectStaticSeedParams).mockResolvedValueOnce([{ id: 'seed-project' }]);

    await expect(generateStaticParams()).resolves.toEqual([{ id: 'seed-project' }]);
  });

  it('프로젝트 상세 뷰 엔트리와 데이터를 반환한다', async () => {
    vi.mocked(getProjectDetailShellData).mockResolvedValueOnce({
      item: {
        id: 'supabase-editorial',
        slug: 'supabase-editorial-slug',
        title: 'Supabase Editorial',
        description: 'detail',
        content: '# heading',
        thumbnail_url: null,
        tags: ['supabase'],
        created_at: '2026-03-01T00:00:00.000Z',
        publish_at: '2026-03-01T00:00:00.000Z',
      },
      resolvedLocale: 'ko',
    });
    vi.mocked(getProjectDetailArchivePageData).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const element = await ProjectDetailRoute({
      params: Promise.resolve({
        id: 'supabase-editorial',
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ProjectDetailPage');
    expect(element.props.locale).toBe('ko');
    expect(getProjectDetailShellData).toHaveBeenCalledWith({
      locale: 'ko',
      projectSlug: 'supabase-editorial',
    });
    expect(getProjectDetailArchivePageData).toHaveBeenCalledWith({
      item: expect.objectContaining({
        id: 'supabase-editorial',
      }),
      locale: 'ko',
    });
    await expect(element.props.initialArchivePagePromise).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('프로젝트 상세 메타데이터에 OG 이미지를 포함한다', async () => {
    vi.mocked(getProjectDetailShellData).mockResolvedValueOnce({
      item: {
        id: 'supabase-editorial',
        slug: 'supabase-editorial-slug',
        title: 'Supabase Editorial',
        description: 'detail',
        content: '# heading',
        thumbnail_url: null,
        tags: ['supabase'],
        created_at: '2026-03-01T00:00:00.000Z',
        publish_at: '2026-03-01T00:00:00.000Z',
      },
      resolvedLocale: 'ko',
    });

    await expect(
      generateMetadata({
        params: Promise.resolve({
          id: 'supabase-editorial',
          locale: 'ko',
        }),
      }),
    ).resolves.toMatchObject({
      openGraph: {
        images: ['https://chaen.dev/api/og/project/supabase-editorial-slug'],
      },
      twitter: {
        images: ['https://chaen.dev/api/og/project/supabase-editorial-slug'],
      },
    });
  });

  it('데이터가 없으면 notFound를 호출한다', async () => {
    vi.mocked(getProjectDetailShellData).mockResolvedValueOnce({
      item: null,
      resolvedLocale: null,
    });

    await expect(
      ProjectDetailRoute({
        params: Promise.resolve({
          id: 'missing-project',
          locale: 'ko',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(getProjectDetailShellData).toHaveBeenCalledWith({
      locale: 'ko',
      projectSlug: 'missing-project',
    });
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
