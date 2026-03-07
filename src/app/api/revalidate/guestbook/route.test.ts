import { revalidatePath, revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { POST } from './route';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('POST /api/revalidate/guestbook', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('secret이 맞으면 guestbook 태그를 무효화한다', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');
    const request = new Request('http://localhost:3000/api/revalidate/guestbook', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith('guestbook');
    expect(revalidatePath).toHaveBeenCalledWith('/ko/guest');
    expect(revalidatePath).toHaveBeenCalledWith('/en/guest');
    expect(revalidatePath).toHaveBeenCalledWith('/ja/guest');
    expect(revalidatePath).toHaveBeenCalledWith('/fr/guest');
  });

  it('entryId가 있으면 단일 항목 태그까지 무효화한다', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');
    const request = new Request(
      'http://localhost:3000/api/revalidate/guestbook?secret=test-secret',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ entryId: 'entry-001' }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('guestbook');
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:entry-001');
    expect(revalidateTag).toHaveBeenCalledWith('guestbook:replies:entry-001');
  });

  it('secret이 다르면 401을 반환한다', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');
    const request = new Request('http://localhost:3000/api/revalidate/guestbook?secret=wrong', {
      method: 'POST',
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
