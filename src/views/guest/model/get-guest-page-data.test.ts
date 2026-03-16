import { vi } from 'vitest';

import { getGuestbookThreads } from '@/entities/guestbook';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';
import { getGuestPageData } from '@/views/guest/model/get-guest-page-data';

vi.mock('@/entities/guestbook', () => ({
  getGuestbookThreads: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('getGuestPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('방명록 첫 페이지 데이터를 뷰 props 형태로 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(getGuestbookThreads).mockResolvedValue({
      items: [
        {
          author_blog_url: null,
          author_name: 'guest',
          content: 'hello',
          created_at: '2026-03-06T00:00:00.000Z',
          deleted_at: null,
          id: 'entry-1',
          is_admin_author: false,
          is_content_masked: false,
          is_secret: false,
          parent_id: null,
          replies: [],
          updated_at: '2026-03-06T00:00:00.000Z',
        },
      ],
      nextCursor: '12',
    });

    const data = await getGuestPageData({ locale: 'ko' });

    expect(getGuestbookThreads).toHaveBeenCalledWith({
      includeSecret: true,
    });
    expect(data).toEqual({
      initialCursor: '12',
      initialItems: expect.any(Array),
    });
  });

  it('서버 조회 실패 시 빈 초기값으로 폴백해 페이지 렌더 오류를 막는다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
    vi.mocked(getGuestbookThreads).mockRejectedValue(new Error('temporary failure'));

    const data = await getGuestPageData({ locale: 'ko' });

    expect(data).toEqual({
      initialCursor: null,
      initialItems: [],
    });
  });

  it('인증 상태 조회에 실패해도 공개 방명록 조회는 계속 시도한다', async () => {
    vi.mocked(getServerAuthState).mockRejectedValue(new Error('auth failure'));
    vi.mocked(getGuestbookThreads).mockResolvedValue({
      items: [
        {
          author_blog_url: null,
          author_name: 'guest',
          content: 'public hello',
          created_at: '2026-03-06T00:00:00.000Z',
          deleted_at: null,
          id: 'entry-2',
          is_admin_author: false,
          is_content_masked: false,
          is_secret: false,
          parent_id: null,
          replies: [],
          updated_at: '2026-03-06T00:00:00.000Z',
        },
      ],
      nextCursor: null,
    });

    const data = await getGuestPageData({ locale: 'ko' });

    expect(getGuestbookThreads).toHaveBeenCalledWith({
      includeSecret: false,
    });
    expect(data).toEqual({
      initialCursor: null,
      initialItems: expect.any(Array),
    });
  });
});
