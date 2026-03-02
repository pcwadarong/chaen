import { revalidateTag } from 'next/cache';
import { vi } from 'vitest';

import { POST } from './route';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

describe('POST /api/revalidate/projects', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('secret이 맞으면 projects 태그를 무효화한다', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');
    const request = new Request('http://localhost:3000/api/revalidate/projects', {
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
    expect(revalidateTag).toHaveBeenCalledWith('projects');
  });

  it('projectId가 있으면 단일 프로젝트 태그까지 무효화한다', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');
    const request = new Request(
      'http://localhost:3000/api/revalidate/projects?secret=test-secret',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ projectId: 'funda-project' }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('projects');
    expect(revalidateTag).toHaveBeenCalledWith('project:funda-project');
  });

  it('secret이 다르면 401을 반환한다', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');
    const request = new Request('http://localhost:3000/api/revalidate/projects?secret=wrong', {
      method: 'POST',
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
