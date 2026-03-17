import { vi } from 'vitest';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileDownloadOptions } from '@/entities/pdf-file/api/get-pdf-file-download-options';
import { getResumePageData } from '@/views/resume/model/get-resume-page-data';

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-download-options', () => ({
  getPdfFileDownloadOptions: vi.fn(),
}));

describe('getResumePageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resume 본문이 없으면 locale fallback 본문과 내부 다운로드 경로를 반환한다', async () => {
    vi.mocked(getPdfFileDownloadOptions).mockResolvedValue([
      {
        assetKey: 'resume-ko',
        fileName: '박채원_이력서.pdf',
        href: '/api/pdf/file/resume-ko',
        locale: 'ko',
      },
      {
        assetKey: 'resume-en',
        fileName: 'ParkChaewon-Resume.pdf',
        href: null,
        locale: 'en',
      },
    ]);
    vi.mocked(getPdfFileContent).mockResolvedValue(null);

    const data = await getResumePageData({ locale: 'ko' });

    expect(getPdfFileDownloadOptions).toHaveBeenCalledWith('resume');
    expect(getPdfFileContent).toHaveBeenCalledWith({ locale: 'ko', kind: 'resume' });
    expect(data.downloadOptions).toEqual([
      {
        assetKey: 'resume-ko',
        fileName: '박채원_이력서.pdf',
        href: '/api/pdf/file/resume-ko',
        locale: 'ko',
      },
      {
        assetKey: 'resume-en',
        fileName: 'ParkChaewon-Resume.pdf',
        href: null,
        locale: 'en',
      },
    ]);
    expect(data.content.locale).toBe('ko');
  });
});
