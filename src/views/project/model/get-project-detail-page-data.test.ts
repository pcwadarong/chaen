import { vi } from 'vitest';

import { getResolvedProject } from '@/entities/project/api/detail/get-project';
import { getProjectDetailList } from '@/entities/project/api/detail/get-project-detail-list';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { serializeLocaleAwarePublishedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
import {
  getProjectDetailArchivePageData,
  getProjectDetailShellData,
  getProjectTagLabels,
} from '@/views/project/model/get-project-detail-page-data';

vi.mock('@/entities/project/api/detail/get-project', () => ({
  getResolvedProject: vi.fn(),
}));

vi.mock('@/entities/project/api/detail/get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
}));

vi.mock('@/entities/tag/api/query-tags', () => ({
  getTagLabelMapBySlugs: vi.fn(),
}));

describe('project detail page data helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shell helper는 상세 본문 최소 데이터만 조회한다', async () => {
    vi.mocked(getResolvedProject).mockResolvedValue({
      item: {
        id: 'funda',
        title: 'FUNDA',
        description: 'cs',
        content: 'detail',
        thumbnail_url: null,
        tags: [],
        created_at: '2026-03-02T00:00:00.000Z',
        publish_at: '2026-03-02T00:00:00.000Z',
        slug: 'funda',
      },
      resolvedLocale: 'ko',
    });

    await expect(
      getProjectDetailShellData({
        locale: 'ko',
        projectSlug: 'funda',
      }),
    ).resolves.toMatchObject({
      item: {
        id: 'funda',
      },
      resolvedLocale: 'ko',
    });
  });

  it('현재 프로젝트가 목록에 없으면 아카이브 맨 앞에 보정한다', async () => {
    const nextCursor = serializeLocaleAwarePublishedAtIdCursor({
      id: 'archive-1',
      locale: 'ko',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });

    vi.mocked(getProjectDetailList).mockResolvedValue({
      items: [
        {
          id: 'archive-1',
          title: 'Archive',
          description: null,
          publish_at: '2026-03-01T00:00:00.000Z',
          slug: 'archive-1',
        },
      ],
      nextCursor,
    });

    const result = await getProjectDetailArchivePageData({
      item: {
        id: 'funda',
        title: 'FUNDA',
        description: 'cs',
        content: 'detail',
        thumbnail_url: null,
        tags: [],
        created_at: '2026-03-02T00:00:00.000Z',
        publish_at: '2026-03-02T00:00:00.000Z',
        slug: 'funda',
      },
      locale: 'ko',
    });

    expect(result.items[0]?.id).toBe('funda');
    expect(result.nextCursor).toBe(
      serializeLocaleAwarePublishedAtIdCursor({
        id: 'funda',
        locale: 'ko',
        publishedAt: '2026-03-02T00:00:00.000Z',
      }),
    );
  });

  it('아카이브 helper는 조회 실패를 그대로 surface한다', async () => {
    vi.mocked(getProjectDetailList).mockRejectedValue(new Error('archive failed'));

    await expect(
      getProjectDetailArchivePageData({
        item: null,
        locale: 'ko',
      }),
    ).rejects.toThrow('archive failed');
  });

  it('태그 label helper는 locale label을 반환한다', async () => {
    vi.mocked(getTagLabelMapBySlugs).mockResolvedValue({
      data: new Map<string, string>([['react', 'React']]),
      schemaMissing: false,
    });

    await expect(
      getProjectTagLabels({
        item: {
          id: 'funda',
          title: 'FUNDA',
          description: 'cs',
          content: 'detail',
          thumbnail_url: null,
          tags: ['react'],
          created_at: '2026-03-02T00:00:00.000Z',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'funda',
        },
        locale: 'ko',
      }),
    ).resolves.toEqual(['React']);
  });
});
