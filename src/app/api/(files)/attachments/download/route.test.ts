// @vitest-environment node

import { GET } from '@/app/api/(files)/attachments/download/route';
import { createOptionalServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createOptionalServiceRoleSupabaseClient: vi.fn(),
}));

describe('api/attachments/download route', () => {
  const createSignedUrl = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    createSignedUrl.mockReset();
    from.mockReset();

    from.mockReturnValue({
      createSignedUrl,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('path 또는 fileName이 없으면 GET은 400을 반환해야 한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/attachments/download'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid attachment download request',
    });
  });

  it.each([
    {
      bucket: 'article',
      expectedSignedUrl: 'https://demo.supabase.co/storage/v1/object/sign/article/demo.pdf',
    },
    {
      bucket: 'resume',
      expectedSignedUrl: 'https://demo.supabase.co/storage/v1/object/sign/resume/demo.pdf',
    },
  ])(
    'bucket이 $bucket이고 attachments 경로가 유효하면 GET은 signed URL로 리다이렉트해야 한다',
    async ({ bucket, expectedSignedUrl }) => {
      vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
        storage: {
          from,
        },
      } as never);
      createSignedUrl.mockResolvedValue({
        data: {
          signedUrl: expectedSignedUrl,
        },
        error: null,
      });

      const response = await GET(
        new Request(
          `https://chaen.dev/api/attachments/download?bucket=${bucket}&path=attachments%2Fdemo.pdf&fileName=resume.pdf`,
        ),
      );

      expect(from).toHaveBeenCalledWith(bucket);
      expect(createSignedUrl).toHaveBeenCalledWith('attachments/demo.pdf', 600, {
        download: 'resume.pdf',
      });
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(expectedSignedUrl);
    },
  );

  it('service role client가 없으면 GET은 404를 반환해야 한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue(null);

    const response = await GET(
      new Request(
        'https://chaen.dev/api/attachments/download?bucket=article&path=attachments%2Fdemo.pdf&fileName=resume.pdf',
      ),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });

  it.each([
    {
      bucket: 'article',
      path: 'attachments',
    },
    {
      bucket: 'article',
      path: 'private%2Fsecret.pdf',
    },
    {
      bucket: 'resume',
      path: 'private%2Fsecret.pdf',
    },
  ])(
    '유효하지 않은 attachments 경로가 주어지면 GET은 400을 반환해야 한다',
    async ({ bucket, path }) => {
      const response = await GET(
        new Request(
          `https://chaen.dev/api/attachments/download?bucket=${bucket}&path=${path}&fileName=resume.pdf`,
        ),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'Invalid attachment download request',
      });
    },
  );

  it('bucket 값이 없으면 GET은 400을 반환해야 한다', async () => {
    const response = await GET(
      new Request(
        'https://chaen.dev/api/attachments/download?path=attachments%2Fdemo.pdf&fileName=resume.pdf',
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid attachment download request',
    });
  });

  it('createSignedUrl이 실패하면 GET은 404를 반환해야 한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      storage: {
        from,
      },
    } as never);
    createSignedUrl.mockResolvedValue({
      data: null,
      error: new Error('missing'),
    });

    const response = await GET(
      new Request(
        'https://chaen.dev/api/attachments/download?bucket=article&path=attachments%2Fdemo.pdf&fileName=resume.pdf',
      ),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });
});
