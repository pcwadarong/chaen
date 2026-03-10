import { getProjectDetailList } from './get-project-detail-list';
import { getProjects } from './get-projects';
import { getProjectDetailArchivePageAction, getProjectsPageAction } from './project-actions';

vi.mock('./get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('./get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
}));

describe('project-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('프로젝트 목록 action은 목록 조회 결과를 반환한다', async () => {
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

  it('프로젝트 아카이브 action은 입력 검증 실패를 바로 반환한다', async () => {
    const result = await getProjectDetailArchivePageAction({
      limit: 0,
      locale: 'ko',
    });

    expect(getProjectDetailList).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: null,
      errorMessage: 'Too small: expected number to be >=1',
      ok: false,
    });
  });
});
