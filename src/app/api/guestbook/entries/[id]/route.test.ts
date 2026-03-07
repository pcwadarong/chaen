import { revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { deleteGuestbookEntry, updateGuestbookEntry } from '@/entities/guestbook';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

import { DELETE, PATCH } from './route';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/entities/guestbook', () => ({
  deleteGuestbookEntry: vi.fn(),
  updateGuestbookEntry: vi.fn(),
}));

vi.mock('@/shared/lib/auth/get-server-auth-state', () => ({
  getServerAuthState: vi.fn(),
}));

describe('/api/guestbook/entries/[id]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH 성공 시 entry 반환 및 캐시 태그를 갱신한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
    vi.mocked(updateGuestbookEntry).mockResolvedValue({
      author_blog_url: null,
      author_name: 'tester',
      content: 'updated',
      created_at: '2026-03-05T00:00:00.000Z',
      deleted_at: null,
      id: 'entry-1',
      is_admin_author: false,
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
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:replies:entry-1');
  });

  it('PATCH가 답글을 수정하면 부모 답글 태그를 갱신한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(updateGuestbookEntry).mockResolvedValue({
      author_blog_url: null,
      author_name: 'admin',
      content: 'updated reply',
      created_at: '2026-03-05T00:00:00.000Z',
      deleted_at: null,
      id: 'reply-1',
      is_admin_author: true,
      is_secret: false,
      parent_id: 'parent-1',
      updated_at: '2026-03-05T00:00:00.000Z',
    });

    const request = new Request('http://localhost:3000/api/guestbook/entries/reply-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'updated reply', password: '' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'reply-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:replies:parent-1');
    expect(updateGuestbookEntry).toHaveBeenCalledWith({
      content: 'updated reply',
      entryId: 'reply-1',
      isAdminActor: true,
      password: '',
    });
  });

  it('DELETE 성공 시 deletedId 반환 및 캐시 태그를 갱신한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
    vi.mocked(deleteGuestbookEntry).mockResolvedValue({ id: 'entry-1', parentId: null });

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
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:replies:entry-1');
  });

  it('DELETE가 답글을 삭제하면 부모 답글 태그를 갱신한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
    });
    vi.mocked(deleteGuestbookEntry).mockResolvedValue({ id: 'reply-1', parentId: 'parent-1' });

    const request = new Request('http://localhost:3000/api/guestbook/entries/reply-1', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: '' }),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'reply-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:replies:parent-1');
    expect(deleteGuestbookEntry).toHaveBeenCalledWith({
      entryId: 'reply-1',
      isAdminActor: true,
      password: '',
    });
  });

  it('PATCH 실패 시 invalid password는 403을 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
    vi.mocked(updateGuestbookEntry).mockRejectedValue(new Error('invalid password'));

    const request = new Request('http://localhost:3000/api/guestbook/entries/entry-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'updated', password: 'wrong' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'entry-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('invalid password');
  });

  it('DELETE 실패 시 invalid password는 403을 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
    vi.mocked(deleteGuestbookEntry).mockRejectedValue(new Error('invalid password'));

    const request = new Request('http://localhost:3000/api/guestbook/entries/entry-1', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'entry-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('invalid password');
  });

  it('관리자 세션이 없으면 관리자 답글 수정은 403을 반환한다', async () => {
    vi.mocked(getServerAuthState).mockResolvedValue({
      isAdmin: false,
      isAuthenticated: false,
      userEmail: null,
      userId: null,
    });
    vi.mocked(updateGuestbookEntry).mockRejectedValue(new Error('admin auth required'));

    const request = new Request('http://localhost:3000/api/guestbook/entries/reply-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'updated reply', password: '' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'reply-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.reason).toBe('admin auth required');
  });
});
