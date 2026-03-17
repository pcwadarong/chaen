import { getProjects } from '@/entities/project/api/list/get-projects';
import { getProjectsPageAction } from '@/features/browse-projects/api/get-projects-page';

vi.mock('@/entities/project/api/list/get-projects', () => ({
  getProjects: vi.fn(),
}));

describe('getProjectsPageAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('프로젝트 목록 조회 결과를 반환한다', async () => {
    vi.mocked(getProjects).mockResolvedValue({
      items: [],
      nextCursor: 'cursor-1',
    });

    const result = await getProjectsPageAction({
      cursor: null,
      limit: 12,
      locale: 'ko',
    });

    expect(getProjects).toHaveBeenCalledWith({
      cursor: null,
      limit: 12,
      locale: 'ko',
    });
    expect(result).toEqual({
      data: {
        items: [],
        nextCursor: 'cursor-1',
      },
      errorMessage: null,
      ok: true,
    });
  });
});
