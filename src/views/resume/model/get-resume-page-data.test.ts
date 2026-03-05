import { vi } from 'vitest';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';

import { getResumePageData } from './get-resume-page-data';

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-url', () => ({
  getPdfFileUrl: vi.fn(),
}));

describe('getResumePageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resume 본문이 없으면 locale fallback 본문을 반환한다', async () => {
    vi.mocked(getPdfFileUrl).mockResolvedValue('https://example.com/resume.pdf');
    vi.mocked(getPdfFileContent).mockResolvedValue(null);

    const data = await getResumePageData({ locale: 'ko' });

    expect(getPdfFileContent).toHaveBeenCalledWith({ locale: 'ko', kind: 'resume' });
    expect(data.resumeUrl).toBe('https://example.com/resume.pdf');
    expect(data.content.locale).toBe('ko');
  });
});
