/* @vitest-environment node */

import { vi } from 'vitest';

import { deletePhotoFile } from '@/entities/hero-photo/api/delete-photo-file';
import { createServiceRoleSupabaseClient } from '@/shared/lib/supabase/service-role';

vi.mock('@/shared/lib/supabase/service-role', () => ({
  createServiceRoleSupabaseClient: vi.fn(),
}));

describe('deletePhotoFile', () => {
  const remove = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    remove.mockReset();
    from.mockReset();

    remove.mockResolvedValue({ error: null });
    from.mockReturnValue({
      remove,
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

  it('photo 버킷에서 지정한 파일 경로를 삭제한다', async () => {
    await expect(deletePhotoFile({ filePath: 'first.jpg' })).resolves.toEqual({
      filePath: 'first.jpg',
    });

    expect(from).toHaveBeenCalledWith('photo');
    expect(remove).toHaveBeenCalledWith(['first.jpg']);
  });

  it('공백뿐인 filePath가 들어오면 Supabase 삭제 호출 전에 유효성 에러를 던진다', async () => {
    await expect(deletePhotoFile({ filePath: '   ' })).rejects.toThrow(
      '[photo-file] 유효하지 않은 파일 경로입니다.',
    );

    expect(from).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('삭제 실패 시 photo 삭제 실패 에러를 던진다', async () => {
    remove.mockResolvedValue({
      error: {
        message: 'delete failed',
      },
    });

    await expect(deletePhotoFile({ filePath: 'missing.jpg' })).rejects.toThrow(
      '[photo-file] 사진 삭제 실패: delete failed',
    );
  });
});
