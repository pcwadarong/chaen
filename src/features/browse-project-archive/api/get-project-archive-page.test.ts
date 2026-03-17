import { getProjectDetailList } from '@/entities/project/api/detail/get-project-detail-list';
import { getProjectDetailArchivePageAction } from '@/features/browse-project-archive/api/get-project-archive-page';

vi.mock('@/entities/project/api/detail/get-project-detail-list', () => ({
  getProjectDetailList: vi.fn(),
}));

describe('getProjectDetailArchivePageAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('입력 검증 실패를 바로 반환한다', async () => {
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
