import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getProjectDetailPageData } from '@/views/project';

import ProjectDetailRoute from './page';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/views/project', () => ({
  getProjectDetailPageData: vi.fn(async () => ({
    archivePage: {
      items: [],
      nextCursor: null,
    },
    item: null,
  })),
  ProjectDetailPage: function ProjectDetailPage() {
    return null;
  },
}));

describe('ProjectDetailRoute', () => {
  it('프로젝트 상세 뷰 엔트리와 데이터를 반환한다', async () => {
    vi.mocked(getProjectDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      item: {
        id: 'supabase-editorial',
        title: 'Supabase Editorial',
        description: 'detail',
        content: '# heading',
        thumbnail_url: null,
        tags: ['supabase'],
        created_at: '2026-03-01T00:00:00.000Z',
      },
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
    expect(getProjectDetailPageData).toHaveBeenCalledWith({
      locale: 'ko',
      projectId: 'supabase-editorial',
    });
  });

  it('데이터가 없으면 notFound를 호출한다', async () => {
    vi.mocked(getProjectDetailPageData).mockResolvedValueOnce({
      archivePage: {
        items: [],
        nextCursor: null,
      },
      item: null,
    });

    await expect(
      ProjectDetailRoute({
        params: Promise.resolve({
          id: 'missing-project',
          locale: 'ko',
        }),
      }),
    ).rejects.toThrow('NOT_FOUND');

    expect(getProjectDetailPageData).toHaveBeenCalledWith({
      locale: 'ko',
      projectId: 'missing-project',
    });
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
