import { vi } from 'vitest';

import { getDashboardPageData } from '@/views/dashboard/model/get-dashboard-page-data';

vi.mock('@/entities/pdf-file', () => ({
  buildPdfFileDownloadPath: vi.fn((kind: string) => `/api/pdf/${kind}`),
  getPdfFileAvailability: vi.fn(),
}));

vi.mock('@/entities/pdf-file/model/config', () => ({
  getPdfFileStorageConfig: vi.fn(),
}));

describe('getDashboardPageData', () => {
  it('resume과 portfolio 업로드 초기 상태를 반환한다', async () => {
    const { getPdfFileAvailability } = await import('@/entities/pdf-file');
    const { getPdfFileStorageConfig } = await import('@/entities/pdf-file/model/config');

    vi.mocked(getPdfFileAvailability).mockImplementation(
      async options => (options?.kind ?? 'resume') === 'resume',
    );
    vi.mocked(getPdfFileStorageConfig).mockImplementation(kind => ({
      bucket: 'pdf',
      downloadFileName: kind === 'resume' ? 'ParkChaewon-Resume.pdf' : 'ParkChaewon-Portfolio.pdf',
      filePath: kind === 'resume' ? 'ParkChaewon-Resume.pdf' : 'ParkChaewon-Portfolio.pdf',
    }));

    await expect(getDashboardPageData()).resolves.toEqual({
      pdfUploadItems: [
        {
          description: '이력서 페이지에서 노출되는 resume PDF를 교체합니다.',
          downloadFileName: 'ParkChaewon-Resume.pdf',
          downloadPath: '/api/pdf/resume',
          filePath: 'ParkChaewon-Resume.pdf',
          isPdfReady: true,
          kind: 'resume',
          title: '이력서 PDF',
        },
        {
          description: '프로젝트 페이지에서 노출되는 포트폴리오 PDF를 교체합니다.',
          downloadFileName: 'ParkChaewon-Portfolio.pdf',
          downloadPath: '/api/pdf/portfolio',
          filePath: 'ParkChaewon-Portfolio.pdf',
          isPdfReady: false,
          kind: 'portfolio',
          title: '포트폴리오 PDF',
        },
      ],
    });
  });
});
