/* @vitest-environment node */

import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

describe('listPhotoFiles', () => {
  const getPublicUrl = vi.fn();
  const list = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    getPublicUrl.mockReset();
    list.mockReset();
    from.mockReset();

    getPublicUrl.mockImplementation((filePath: string) => ({
      data: {
        publicUrl: `https://example.com/${filePath}`,
      },
    }));
    from.mockReturnValue({
      getPublicUrl,
      list,
    });
    vi.mocked(createServiceRoleSupabaseClient).mockReturnValue({
      storage: {
        from,
      },
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('단일 storage 페이지가 created_at 오름차순으로 반환될 때, listPhotoFiles는 같은 순서의 공개 URL 목록을 반환해야 한다', async () => {
    list.mockResolvedValueOnce({
      data: [
        {
          created_at: '2026-03-26T10:00:00.000Z',
          id: 'photo-1',
          metadata: {
            mimetype: 'image/jpeg',
            size: 120_000,
          },
          name: 'first.jpg',
          updated_at: '2026-03-26T10:00:00.000Z',
        },
        {
          created_at: '2026-03-26T10:01:00.000Z',
          id: 'photo-2',
          metadata: {
            mimetype: 'image/png',
            size: 98_000,
          },
          name: 'second.png',
          updated_at: '2026-03-26T10:01:00.000Z',
        },
      ],
      error: null,
    });

    await expect(listPhotoFiles()).resolves.toEqual([
      {
        createdAt: '2026-03-26T10:00:00.000Z',
        fileName: 'first.jpg',
        filePath: 'first.jpg',
        mimeType: 'image/jpeg',
        publicUrl: 'https://example.com/first.jpg',
        size: 120_000,
      },
      {
        createdAt: '2026-03-26T10:01:00.000Z',
        fileName: 'second.png',
        filePath: 'second.png',
        mimeType: 'image/png',
        publicUrl: 'https://example.com/second.png',
        size: 98_000,
      },
    ]);

    expect(from).toHaveBeenCalledWith('photo');
    expect(list).toHaveBeenNthCalledWith(1, '', {
      limit: 1000,
      offset: 0,
      sortBy: {
        column: 'created_at',
        order: 'asc',
      },
    });
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('Storage 목록 조회가 실패할 때, listPhotoFiles는 photo 목록 조회 실패 에러를 던져야 한다', async () => {
    list.mockResolvedValue({
      data: null,
      error: {
        message: 'permission denied',
      },
    });

    await expect(listPhotoFiles()).rejects.toThrow(
      '[photo-file] 사진 목록 조회 실패: permission denied',
    );
  });
});
