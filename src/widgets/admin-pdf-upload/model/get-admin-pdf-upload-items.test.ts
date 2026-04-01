/** @vitest-environment node */

import { getAdminPdfUploadItems } from '@/widgets/admin-pdf-upload/model/get-admin-pdf-upload-items';

vi.mock('@/entities/pdf-file', () => ({
  buildPdfFileAssetDownloadPath: vi.fn((assetKey: string) => `/api/pdf/file/${assetKey}`),
}));

vi.mock('@/entities/pdf-file/model/config', () => ({
  listPdfFileAssetStorageConfigs: vi.fn(() => [
    {
      assetKey: 'resume-ko',
      downloadFileName: 'ParkChaewon-Resume-ko.pdf',
      filePath: 'pdf/ParkChaewon-Resume-ko.pdf',
      title: '이력서 PDF (KO)',
    },
    {
      assetKey: 'portfolio-en',
      downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
      filePath: 'pdf/ParkChaewon-Portfolio-en.pdf',
      title: '포트폴리오 PDF (EN)',
    },
  ]),
}));

describe('getAdminPdfUploadItems', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('고정 PDF 자산 구성이 주어지면, getAdminPdfUploadItems는 관리자 업로드 항목 배열을 반환해야 한다', () => {
    expect(getAdminPdfUploadItems()).toEqual([
      {
        assetKey: 'resume-ko',
        downloadFileName: 'ParkChaewon-Resume-ko.pdf',
        downloadPath: '/api/pdf/file/resume-ko',
        filePath: 'pdf/ParkChaewon-Resume-ko.pdf',
        isPdfReady: false,
        title: '이력서 PDF (KO)',
      },
      {
        assetKey: 'portfolio-en',
        downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
        downloadPath: '/api/pdf/file/portfolio-en',
        filePath: 'pdf/ParkChaewon-Portfolio-en.pdf',
        isPdfReady: false,
        title: '포트폴리오 PDF (EN)',
      },
    ]);
  });
});
