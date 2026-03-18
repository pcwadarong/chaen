import { uploadPdfFileByAssetKey } from '@/entities/pdf-file/api/upload-pdf-file-by-asset-key';

describe('uploadPdfFileByAssetKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('정상 응답이면 업로드 결과를 반환한다', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        assetKey: 'resume-ko',
        downloadFileName: 'ParkChaewon-Resume-kr.pdf',
        downloadPath: '/api/pdf/file/resume-ko',
        filePath: 'ParkChaewon-Resume-kr.pdf',
        isPdfReady: true,
      }),
      ok: true,
      text: async () => '',
    } as unknown as Response);

    await expect(
      uploadPdfFileByAssetKey({
        assetKey: 'resume-ko',
        file: new File(['pdf'], 'resume-ko.pdf', { type: 'application/pdf' }),
      }),
    ).resolves.toEqual({
      assetKey: 'resume-ko',
      downloadFileName: 'ParkChaewon-Resume-kr.pdf',
      downloadPath: '/api/pdf/file/resume-ko',
      filePath: 'ParkChaewon-Resume-kr.pdf',
      isPdfReady: true,
    });
  });

  it('json 파싱이 실패하면 text fallback 오류 메시지를 사용한다', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => {
        throw new Error('invalid json');
      },
      ok: false,
      text: async () => '업로드 중 서버 오류가 발생했습니다.',
    } as unknown as Response);

    await expect(
      uploadPdfFileByAssetKey({
        assetKey: 'resume-ko',
        file: new File(['pdf'], 'resume-ko.pdf', { type: 'application/pdf' }),
      }),
    ).rejects.toThrow('업로드 중 서버 오류가 발생했습니다.');
  });

  it('필수 필드가 비면 기본 오류 메시지를 사용한다', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        assetKey: 'resume-ko',
      }),
      ok: true,
      text: async () => '',
    } as unknown as Response);

    await expect(
      uploadPdfFileByAssetKey({
        assetKey: 'resume-ko',
        file: new File(['pdf'], 'resume-ko.pdf', { type: 'application/pdf' }),
      }),
    ).rejects.toThrow('PDF 업로드에 실패했습니다.');
  });
});
