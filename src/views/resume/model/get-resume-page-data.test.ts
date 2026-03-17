import { vi } from 'vitest';

import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getResumePageData } from '@/views/resume/model/get-resume-page-data';

vi.mock('@/entities/pdf-file/api/get-pdf-file-availability', () => ({
  getPdfFileAvailability: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(),
}));

describe('getResumePageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resume 본문이 없으면 locale fallback 본문과 내부 다운로드 경로를 반환한다', async () => {
    vi.mocked(getPdfFileAvailability).mockResolvedValue(true);
    vi.mocked(getPdfFileContent).mockResolvedValue(null);

    const data = await getResumePageData({ locale: 'ko' });

    expect(getPdfFileAvailability).toHaveBeenCalledWith({ kind: 'resume' });
    expect(getPdfFileContent).toHaveBeenCalledWith({ locale: 'ko', kind: 'resume' });
    expect(data.resumeDownloadHref).toBe('/api/pdf/resume');
    expect(data.content.locale).toBe('ko');
  });
});
