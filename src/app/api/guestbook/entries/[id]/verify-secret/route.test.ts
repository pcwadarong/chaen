import { vi } from 'vitest';

import { verifyGuestbookSecret } from '@/entities/guestbook';

import { POST } from './route';

vi.mock('@/entities/guestbook', () => ({
  verifyGuestbookSecret: vi.fn(),
}));

describe('POST /api/guestbook/entries/[id]/verify-secret', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 비밀글 본문 entry를 반환한다', async () => {
    vi.mocked(verifyGuestbookSecret).mockResolvedValue({
      author_blog_url: null,
      author_name: 'tester',
      content: 'secret content',
      created_at: '2026-03-05T00:00:00.000Z',
      deleted_at: null,
      id: 'entry-1',
      is_admin_reply: false,
      is_secret: true,
      parent_id: null,
      updated_at: '2026-03-05T00:00:00.000Z',
    });

    const request = new Request(
      'http://localhost:3000/api/guestbook/entries/entry-1/verify-secret',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: '1234' }),
      },
    );

    const response = await POST(request, { params: Promise.resolve({ id: 'entry-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.entry.content).toBe('secret content');
  });

  it('실패 시 invalid password는 403을 반환한다', async () => {
    vi.mocked(verifyGuestbookSecret).mockRejectedValue(new Error('invalid password'));

    const request = new Request(
      'http://localhost:3000/api/guestbook/entries/entry-1/verify-secret',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'wrong' }),
      },
    );

    const response = await POST(request, { params: Promise.resolve({ id: 'entry-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('invalid password');
  });
});
