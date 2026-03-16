import { vi } from 'vitest';

import { getProject } from '@/entities/project/api/detail/get-project';
import { getProjectDetailList } from '@/entities/project/api/detail/get-project-detail-list';
import { serializeLocaleAwarePublishedAtIdCursor } from '@/shared/lib/pagination/keyset-pagination';
import { getProjectDetailPageData } from '@/views/project/model/get-project-detail-page-data';

vi.mock('@/entities/project/api/detail/get-project', () => ({
  getProject: vi.fn(),
}));

vi.mock('@/entities/project/api/detail/get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
}));

describe('getProjectDetailPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('현재 프로젝트가 목록에 없으면 맨 앞에 보정한다', async () => {
    const nextCursor = serializeLocaleAwarePublishedAtIdCursor({
      id: 'archive-1',
      locale: 'ko',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });

    vi.mocked(getProject).mockResolvedValue({
      id: 'funda',
      title: 'FUNDA',
      description: 'cs',
      content: 'detail',
      thumbnail_url: null,
      tags: [],
      created_at: '2026-03-02T00:00:00.000Z',
      publish_at: '2026-03-02T00:00:00.000Z',
      slug: 'funda',
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

    const result = await getProjectDetailPageData({
      locale: 'ko',
      projectSlug: 'funda',
    });

    expect(result.archivePage.items[0]?.id).toBe('funda');
    expect(result.archivePage.nextCursor).toBe(
      serializeLocaleAwarePublishedAtIdCursor({
        id: 'funda',
        locale: 'ko',
        publishedAt: '2026-03-02T00:00:00.000Z',
      }),
    );
    expect(result.item?.id).toBe('funda');
  });

  it('아카이브 목록 조회 실패는 그대로 surface한다', async () => {
    vi.mocked(getProject).mockResolvedValue(null);
    vi.mocked(getProjectDetailList).mockRejectedValue(new Error('archive failed'));

    await expect(
      getProjectDetailPageData({
        locale: 'ko',
        projectSlug: 'funda',
      }),
    ).rejects.toThrow('archive failed');
  });

  it('현재 프로젝트가 이미 목록에 있으면 cursor를 그대로 둔다', async () => {
    const nextCursor = serializeLocaleAwarePublishedAtIdCursor({
      id: 'archive-1',
      locale: 'ko',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });

    vi.mocked(getProject).mockResolvedValue({
      id: 'archive-1',
      title: 'Archive',
      description: 'cs',
      content: 'detail',
      thumbnail_url: null,
      tags: [],
      created_at: '2026-03-01T00:00:00.000Z',
      publish_at: '2026-03-01T00:00:00.000Z',
      slug: 'archive-1',
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

    const result = await getProjectDetailPageData({
      locale: 'ko',
      projectSlug: 'archive-1',
    });

    expect(result.archivePage.nextCursor).toBe(nextCursor);
    expect(result.archivePage.items).toHaveLength(1);
  });
});
