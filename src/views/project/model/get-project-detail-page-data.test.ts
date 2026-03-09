import { vi } from 'vitest';

import { getProject } from '@/entities/project/api/get-project';
import { getProjectDetailList } from '@/entities/project/api/get-project-detail-list';

import { getProjectDetailPageData } from './get-project-detail-page-data';

vi.mock('@/entities/project/api/get-project', () => ({
  getProject: vi.fn(),
}));

vi.mock('@/entities/project/api/get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
}));

describe('getProjectDetailPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('현재 프로젝트가 목록에 없으면 맨 앞에 보정한다', async () => {
    vi.mocked(getProject).mockResolvedValue({
      id: 'funda',
      title: 'FUNDA',
      description: 'cs',
      content: 'detail',
      thumbnail_url: null,
      tags: [],
      created_at: '2026-03-02T00:00:00.000Z',
    });
    vi.mocked(getProjectDetailList).mockResolvedValue({
      items: [
        {
          id: 'archive-1',
          title: 'Archive',
          description: null,
          created_at: '2026-03-01T00:00:00.000Z',
        },
      ],
      nextCursor: 'cursor-1',
    });

    const result = await getProjectDetailPageData({
      locale: 'ko',
      projectId: 'funda',
    });

    expect(result.archivePage.items[0]?.id).toBe('funda');
    expect(result.archivePage.nextCursor).toBe('cursor-1');
    expect(result.item?.id).toBe('funda');
  });

  it('아카이브 목록 조회 실패는 그대로 surface한다', async () => {
    vi.mocked(getProject).mockResolvedValue(null);
    vi.mocked(getProjectDetailList).mockRejectedValue(new Error('archive failed'));

    await expect(
      getProjectDetailPageData({
        locale: 'ko',
        projectId: 'funda',
      }),
    ).rejects.toThrow('archive failed');
  });
});
