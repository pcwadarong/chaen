import { GET } from '@/app/api/(content)/tags/route';
import { getTagOptionsByLocale } from '@/entities/tag/api/query-tags';

vi.mock('@/entities/tag/api/query-tags', () => ({
  getTagOptionsByLocale: vi.fn(),
}));

describe('api/tags route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('locale 기준 태그 목록을 반환한다', async () => {
    vi.mocked(getTagOptionsByLocale).mockResolvedValue([
      { id: 'tag-1', label: '접근성', slug: 'a11y' },
    ]);

    const response = await GET(new Request('https://chaen.dev/api/tags?locale=ko'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getTagOptionsByLocale).toHaveBeenCalledWith('ko');
    expect(body).toEqual([{ id: 'tag-1', label: '접근성', slug: 'a11y' }]);
  });
});
