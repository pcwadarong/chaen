// @vitest-environment node

import { getTranslations } from 'next-intl/server';
import { vi } from 'vitest';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getResumePageData } from '@/views/resume/model/get-resume-page-data';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(),
}));

describe('getResumePageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resume 본문이 없으면 locale fallback 본문을 반환한다', async () => {
    const translation = ((key: string) =>
      key === 'resumeDownloadUnavailable' ? 'Unavailable' : key) as unknown as Awaited<
      ReturnType<typeof getTranslations>
    >;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getPdfFileContent).mockResolvedValue(null);

    const data = await getResumePageData({ locale: 'ko' });

    expect(getPdfFileContent).toHaveBeenCalledWith({ locale: 'ko', kind: 'resume' });
    expect(data.content.locale).toBe('ko');
    expect(data.downloadLabel).toBe('downloadButtonLabel');
    expect(data.unavailableLabel).toBe('Unavailable');
  });

  it('resume 본문 조회가 실패해도 기본 본문으로 폴백한다', async () => {
    const translation = ((key: string) =>
      key === 'resumeDownloadUnavailable' ? 'Unavailable' : key) as unknown as Awaited<
      ReturnType<typeof getTranslations>
    >;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getPdfFileContent).mockRejectedValue(new Error('pdf content failed'));

    const data = await getResumePageData({ locale: 'ko' });

    expect(data.content.locale).toBe('ko');
    expect(data.downloadLabel).toBe('downloadButtonLabel');
    expect(data.unavailableLabel).toBe('Unavailable');
  });
});
