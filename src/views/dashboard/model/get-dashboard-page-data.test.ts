import { vi } from 'vitest';

import { getDashboardPageData } from '@/views/dashboard/model/get-dashboard-page-data';

vi.mock('@/entities/pdf-file', () => ({
  buildPdfFileAssetDownloadPath: vi.fn((assetKey: string) => `/api/pdf/file/${assetKey}`),
  getPdfFileAvailability: vi.fn(),
}));

vi.mock('@/entities/pdf-file/model/config', () => ({
  listPdfFileAssetStorageConfigs: vi.fn(),
}));

describe('getDashboardPageData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('4개 PDF 자산 업로드 초기 상태를 반환한다', async () => {
    const { getPdfFileAvailability } = await import('@/entities/pdf-file');
    const { listPdfFileAssetStorageConfigs } = await import('@/entities/pdf-file/model/config');

    vi.mocked(getPdfFileAvailability).mockImplementation(
      async options => options?.assetKey === 'resume-en',
    );
    vi.mocked(listPdfFileAssetStorageConfigs).mockReturnValue([
      {
        assetKey: 'resume-ko',
        bucket: 'pdf',
        downloadFileName: 'ParkChaewon-Resume-kr.pdf',
        filePath: 'ParkChaewon-Resume-kr.pdf',
        kind: 'resume',
        locale: 'ko',
        title: '이력서 PDF · 국문',
      },
      {
        assetKey: 'resume-en',
        bucket: 'pdf',
        downloadFileName: 'ParkChaewon-Resume-en.pdf',
        filePath: 'ParkChaewon-Resume-en.pdf',
        kind: 'resume',
        locale: 'en',
        title: '이력서 PDF · 영문',
      },
      {
        assetKey: 'portfolio-ko',
        bucket: 'pdf',
        downloadFileName: 'ParkChaewon-Portfolio-kr.pdf',
        filePath: 'ParkChaewon-Portfolio-kr.pdf',
        kind: 'portfolio',
        locale: 'ko',
        title: '포트폴리오 PDF · 국문',
      },
      {
        assetKey: 'portfolio-en',
        bucket: 'pdf',
        downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
        filePath: 'ParkChaewon-Portfolio-en.pdf',
        kind: 'portfolio',
        locale: 'en',
        title: '포트폴리오 PDF · 영문',
      },
    ]);

    await expect(getDashboardPageData()).resolves.toEqual({
      pdfUploadItems: [
        {
          assetKey: 'resume-ko',
          downloadFileName: 'ParkChaewon-Resume-kr.pdf',
          downloadPath: '/api/pdf/file/resume-ko',
          filePath: 'ParkChaewon-Resume-kr.pdf',
          isPdfReady: false,
          title: '이력서 PDF · 국문',
        },
        {
          assetKey: 'resume-en',
          downloadFileName: 'ParkChaewon-Resume-en.pdf',
          downloadPath: '/api/pdf/file/resume-en',
          filePath: 'ParkChaewon-Resume-en.pdf',
          isPdfReady: true,
          title: '이력서 PDF · 영문',
        },
        {
          assetKey: 'portfolio-ko',
          downloadFileName: 'ParkChaewon-Portfolio-kr.pdf',
          downloadPath: '/api/pdf/file/portfolio-ko',
          filePath: 'ParkChaewon-Portfolio-kr.pdf',
          isPdfReady: false,
          title: '포트폴리오 PDF · 국문',
        },
        {
          assetKey: 'portfolio-en',
          downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
          downloadPath: '/api/pdf/file/portfolio-en',
          filePath: 'ParkChaewon-Portfolio-en.pdf',
          isPdfReady: false,
          title: '포트폴리오 PDF · 영문',
        },
      ],
    });
  });

  it('PDF 준비 상태 조회가 실패하면 로그를 남기고 false로 폴백한다', async () => {
    const { getPdfFileAvailability } = await import('@/entities/pdf-file');
    const { listPdfFileAssetStorageConfigs } = await import('@/entities/pdf-file/model/config');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(getPdfFileAvailability).mockRejectedValue(new Error('storage unavailable'));
    vi.mocked(listPdfFileAssetStorageConfigs).mockReturnValue([
      {
        assetKey: 'resume-ko',
        bucket: 'pdf',
        downloadFileName: 'ParkChaewon-Resume-kr.pdf',
        filePath: 'ParkChaewon-Resume-kr.pdf',
        kind: 'resume',
        locale: 'ko',
        title: '이력서 PDF · 국문',
      },
    ]);

    await expect(getDashboardPageData()).resolves.toEqual({
      pdfUploadItems: [
        {
          assetKey: 'resume-ko',
          downloadFileName: 'ParkChaewon-Resume-kr.pdf',
          downloadPath: '/api/pdf/file/resume-ko',
          filePath: 'ParkChaewon-Resume-kr.pdf',
          isPdfReady: false,
          title: '이력서 PDF · 국문',
        },
      ],
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('[dashboard] pdf availability read failed', {
      assetKey: 'resume-ko',
      error: expect.any(Error),
    });
  });
});
