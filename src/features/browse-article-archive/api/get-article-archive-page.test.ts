import { getArticleDetailList } from '@/entities/article/api/detail/get-article-detail-list';
import { getArticleDetailArchivePageAction } from '@/features/browse-article-archive/api/get-article-archive-page';

vi.mock('@/entities/article/api/detail/get-article-detail-list', () => ({
  getArticleDetailList: vi.fn(),
}));

describe('getArticleDetailArchivePageAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('상세 아카이브 조회 결과를 그대로 반환한다', async () => {
    vi.mocked(getArticleDetailList).mockResolvedValue({
      items: [],
      nextCursor: 'cursor-2',
    });

    const result = await getArticleDetailArchivePageAction({
      cursor: null,
      limit: 10,
      locale: 'en',
    });

    expect(getArticleDetailList).toHaveBeenCalledWith({
      cursor: null,
      limit: 10,
      locale: 'en',
    });
    expect(result.ok).toBe(true);
    expect(result.data?.nextCursor).toBe('cursor-2');
  });
});
