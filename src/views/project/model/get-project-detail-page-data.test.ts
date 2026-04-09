// @vitest-environment node

import { vi } from 'vitest';

import { getResolvedProject } from '@/entities/project/api/detail/get-project';
import {
  getProjectDetailList,
  getProjectDetailListWindow,
} from '@/entities/project/api/detail/get-project-detail-list';
import {
  getProjectDetailArchivePageData,
  getProjectDetailShellData,
} from '@/views/project/model/get-project-detail-page-data';

vi.mock('@/entities/project/api/detail/get-project', () => ({
  getResolvedProject: vi.fn(),
}));

vi.mock('@/entities/project/api/detail/get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
  getProjectDetailListWindow: vi.fn(),
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

  it('현재 프로젝트 기준 초기 아카이브 slice를 조회한다', async () => {
    vi.mocked(getProjectDetailListWindow).mockResolvedValue({
      items: [
        {
          id: 'funda',
          title: 'FUNDA',
          description: 'cs',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'funda',
        },
        {
          id: 'archive-1',
          title: 'Archive',
          description: null,
          publish_at: '2026-03-01T00:00:00.000Z',
          slug: 'archive-1',
        },
      ],
      nextCursor: 'cursor-1',
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
    expect(getProjectDetailListWindow).toHaveBeenCalledWith({
      currentItem: {
        description: 'cs',
        id: 'funda',
        publish_at: '2026-03-02T00:00:00.000Z',
        slug: 'funda',
        title: 'FUNDA',
      },
      locale: 'ko',
    });
  });

  it('아카이브 helper는 조회 실패 시 현재 항목만 유지한 빈 목록으로 폴백한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(getProjectDetailListWindow).mockRejectedValue(new Error('archive failed'));

    await expect(
      getProjectDetailArchivePageData({
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
      }),
    ).resolves.toEqual({
      items: [
        {
          id: 'funda',
          title: 'FUNDA',
          description: 'cs',
          publish_at: '2026-03-02T00:00:00.000Z',
          slug: 'funda',
        },
      ],
      nextCursor: null,
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[projects] getProjectDetailListWindow failed for locale',
      expect.objectContaining({
        error: expect.any(Error),
        locale: 'ko',
      }),
    );
  });

  it('현재 항목이 없으면 기본 상세 목록 조회로 폴백한다', async () => {
    vi.mocked(getProjectDetailList).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    await expect(
      getProjectDetailArchivePageData({
        item: null,
        locale: 'ko',
      }),
    ).resolves.toEqual({
      items: [],
      nextCursor: null,
    });

    expect(getProjectDetailList).toHaveBeenCalledWith({ locale: 'ko' });
  });
});
