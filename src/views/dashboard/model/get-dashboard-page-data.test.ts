import { vi } from 'vitest';

import { getDashboardPageData } from '@/views/dashboard/model/get-dashboard-page-data';

vi.mock('@/entities/pdf-file', () => ({
  buildPdfFileAssetDownloadPath: vi.fn((assetKey: string) => `/api/pdf/file/${assetKey}`),
}));

vi.mock('@/entities/pdf-file/model/config', () => ({
  listPdfFileAssetStorageConfigs: vi.fn(),
}));

describe('getDashboardPageData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('4개 PDF 자산 업로드 초기 상태를 반환한다', async () => {
    const { listPdfFileAssetStorageConfigs } = await import('@/entities/pdf-file/model/config');

    vi.mocked(listPdfFileAssetStorageConfigs).mockReturnValue([
      {
        assetKey: 'resume-ko',
        bucket: 'resume',
        downloadFileName: 'ParkChaewon-Resume-kr.pdf',
        filePath: 'pdf/ParkChaewon-Resume-kr.pdf',
        kind: 'resume',
        locale: 'ko',
        title: '이력서 PDF · 국문',
      },
      {
        assetKey: 'resume-en',
        bucket: 'resume',
        downloadFileName: 'ParkChaewon-Resume-en.pdf',
        filePath: 'pdf/ParkChaewon-Resume-en.pdf',
        kind: 'resume',
        locale: 'en',
        title: '이력서 PDF · 영문',
      },
      {
        assetKey: 'portfolio-ko',
        bucket: 'project',
        downloadFileName: 'ParkChaewon-Portfolio-kr.pdf',
        filePath: 'pdf/ParkChaewon-Portfolio-kr.pdf',
        kind: 'portfolio',
        locale: 'ko',
        title: '포트폴리오 PDF · 국문',
      },
      {
        assetKey: 'portfolio-en',
        bucket: 'project',
        downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
        filePath: 'pdf/ParkChaewon-Portfolio-en.pdf',
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
          filePath: 'pdf/ParkChaewon-Resume-kr.pdf',
          isPdfReady: false,
          title: '이력서 PDF · 국문',
        },
        {
          assetKey: 'resume-en',
          downloadFileName: 'ParkChaewon-Resume-en.pdf',
          downloadPath: '/api/pdf/file/resume-en',
          filePath: 'pdf/ParkChaewon-Resume-en.pdf',
          isPdfReady: false,
          title: '이력서 PDF · 영문',
        },
        {
          assetKey: 'portfolio-ko',
          downloadFileName: 'ParkChaewon-Portfolio-kr.pdf',
          downloadPath: '/api/pdf/file/portfolio-ko',
          filePath: 'pdf/ParkChaewon-Portfolio-kr.pdf',
          isPdfReady: false,
          title: '포트폴리오 PDF · 국문',
        },
        {
          assetKey: 'portfolio-en',
          downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
          downloadPath: '/api/pdf/file/portfolio-en',
          filePath: 'pdf/ParkChaewon-Portfolio-en.pdf',
          isPdfReady: false,
          title: '포트폴리오 PDF · 영문',
        },
      ],
    });
  });
});
