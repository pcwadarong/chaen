import { revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { deleteGuestbookEntry, updateGuestbookEntry } from '@/entities/guestbook';

import { DELETE, PATCH } from './route';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/entities/guestbook', () => ({
  deleteGuestbookEntry: vi.fn(),
  updateGuestbookEntry: vi.fn(),
}));

describe('/api/guestbook/entries/[id]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH 성공 시 entry 반환 및 캐시 태그를 갱신한다', async () => {
    vi.mocked(updateGuestbookEntry).mockResolvedValue({
      author_blog_url: null,
      author_name: 'tester',
      content: 'updated',
      created_at: '2026-03-05T00:00:00.000Z',
      deleted_at: null,
      id: 'entry-1',
      is_admin_reply: false,
      is_secret: false,
      parent_id: null,
      updated_at: '2026-03-05T00:00:00.000Z',
    });

    const request = new Request('http://localhost:3000/api/guestbook/entries/entry-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'updated', password: '1234' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'entry-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('guestbook');
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:entry-1');
  });

  it('DELETE 성공 시 deletedId 반환 및 캐시 태그를 갱신한다', async () => {
    vi.mocked(deleteGuestbookEntry).mockResolvedValue({ id: 'entry-1' });

    const request = new Request('http://localhost:3000/api/guestbook/entries/entry-1', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: '1234' }),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'entry-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.deletedId).toBe('entry-1');
    expect(revalidateTag).toHaveBeenCalledWith('guestbook');
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:entry-1');
  });
});
