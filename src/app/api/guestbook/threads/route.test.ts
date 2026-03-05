import { vi } from 'vitest';

import { getGuestbookThreads } from '@/entities/guestbook';

import { GET } from './route';

vi.mock('@/entities/guestbook', () => ({
  getGuestbookThreads: vi.fn(),
}));

describe('GET /api/guestbook/threads', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 목록과 nextCursor를 반환한다', async () => {
    vi.mocked(getGuestbookThreads).mockResolvedValue({
      items: [],
      nextCursor: '12',
    });

    const response = await GET(
      new Request('http://localhost:3000/api/guestbook/threads?cursor=0&limit=12'),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.isAdmin).toBe(true);
    expect(payload.nextCursor).toBe('12');
    expect(getGuestbookThreads).toHaveBeenCalledWith({
      cursor: '0',
      includeSecret: true,
      limit: 12,
    });
  });

  it('실패 시 500과 사유를 반환한다', async () => {
    vi.mocked(getGuestbookThreads).mockRejectedValue(new Error('db failed'));

    const response = await GET(new Request('http://localhost:3000/api/guestbook/threads'));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('db failed');
  });
});
