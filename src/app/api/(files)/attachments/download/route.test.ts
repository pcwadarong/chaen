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

  it('path 또는 fileName이 없으면 400을 반환한다', async () => {
    const response = await GET(new Request('https://chaen.dev/api/attachments/download'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid attachment download request',
    });
  });

  it('signed URL 생성에 성공하면 리다이렉트한다', async () => {
    vi.mocked(createOptionalServiceRoleSupabaseClient).mockReturnValue({
      storage: {
        from,
      },
    } as never);
    createSignedUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://demo.supabase.co/storage/v1/object/sign/file/demo.pdf',
      },
      error: null,
    });

    const response = await GET(
      new Request(
        'https://chaen.dev/api/attachments/download?path=article%2Fattachments%2Fdemo.pdf&fileName=resume.pdf',
      ),
    );

    expect(from).toHaveBeenCalledWith('file');
    expect(createSignedUrl).toHaveBeenCalledWith('article/attachments/demo.pdf', 600, {
      download: 'resume.pdf',
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'https://demo.supabase.co/storage/v1/object/sign/file/demo.pdf',
    );
  });

  it('signed URL 생성에 실패하면 404를 반환한다', async () => {
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
        'https://chaen.dev/api/attachments/download?path=article%2Fattachments%2Fdemo.pdf&fileName=resume.pdf',
      ),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not Found',
    });
  });
});
