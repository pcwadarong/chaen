import { revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { createGuestbookEntry } from '@/entities/guestbook';

import { POST } from './route';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/entities/guestbook', () => ({
  createGuestbookEntry: vi.fn(),
}));

describe('POST /api/guestbook/entries', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 entry를 반환하고 guestbook 태그를 갱신한다', async () => {
    vi.mocked(createGuestbookEntry).mockResolvedValue({
      author_blog_url: null,
      author_name: 'tester',
      content: 'hello',
      created_at: '2026-03-05T00:00:00.000Z',
      deleted_at: null,
      id: 'entry-1',
      is_admin_reply: false,
      is_secret: false,
      parent_id: null,
      updated_at: '2026-03-05T00:00:00.000Z',
    });

    const request = new Request('http://localhost:3000/api/guestbook/entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        authorName: 'tester',
        content: 'hello',
        password: '1234',
      }),
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('guestbook');
  });
});
