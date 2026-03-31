// @vitest-environment node

import { uploadPdfFile } from '@/entities/pdf-file/api/upload-pdf-file';
import { uploadStorageFile } from '@/shared/lib/storage/upload-storage-file';
import { resolveStorageWriteSupabaseClient } from '@/shared/lib/supabase/storage-client';

vi.mock('@/shared/lib/supabase/storage-client', () => ({
  resolveStorageWriteSupabaseClient: vi.fn(),
}));

vi.mock('@/shared/lib/storage/upload-storage-file', () => ({
  uploadStorageFile: vi.fn(),
}));

describe('uploadPdfFile', () => {
  beforeEach(() => {
    vi.mocked(uploadStorageFile).mockResolvedValue({
      filePath: 'pdf/ParkChaewon-Resume-en.pdf',
      uploadData: {},
    });

    vi.mocked(resolveStorageWriteSupabaseClient).mockResolvedValue({
      storage: {
        from: vi.fn(),
      },
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    {
      directory: undefined,
      label: 'directory가 없으면',
    },
    {
      directory: '',
      label: 'directory가 비어 있으면',
    },
  ])('$label uploadPdfFile은 pdf 디렉터리를 기본 경로로 사용해야 한다', async ({ directory }) => {
    await uploadPdfFile({
      bucket: 'resume',
      directory,
      file: new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }),
    });

    expect(uploadStorageFile).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketName: 'resume',
        filePath: expect.stringMatching(/^pdf\//),
      }),
    );
  });

  it('filePath가 주어지면 uploadPdfFile은 기본 경로 대신 filePath를 사용해야 한다', async () => {
    await uploadPdfFile({
      bucket: 'project',
      directory: '',
      file: new File(['pdf'], 'portfolio.pdf', { type: 'application/pdf' }),
      filePath: 'pdf/custom.pdf',
    });

    expect(uploadStorageFile).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketName: 'project',
        filePath: 'pdf/custom.pdf',
      }),
    );
  });
});
