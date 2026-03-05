import { getTranslations } from 'next-intl/server';
import { vi } from 'vitest';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { getProjects } from '@/entities/project/api/get-projects';

import { getProjectListPageData } from './get-project-list-page-data';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

vi.mock('@/entities/project/api/get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-url', () => ({
  getPdfFileUrl: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(),
}));

describe('getProjectListPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('목록/다운로드/번역 데이터를 조합해 반환한다', async () => {
    const translation = ((key: string) => {
      if (key === 'portfolioDownload') return 'Download';
      if (key === 'portfolioDownloadUnavailable') return 'Unavailable';

      return key;
    }) as unknown as Awaited<ReturnType<typeof getTranslations>>;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getProjects).mockResolvedValue({ items: [], nextCursor: null });
    vi.mocked(getPdfFileUrl).mockResolvedValue('https://example.com/portfolio.pdf');
    vi.mocked(getPdfFileContent).mockResolvedValue({
      body: 'body',
      description: 'desc',
      download_button_label: '다운로드',
      download_unavailable_label: '준비 중',
      locale: 'ko',
      title: 'title',
      updated_at: '2026-03-01T00:00:00.000Z',
    });

    const data = await getProjectListPageData({ locale: 'ko' });

    expect(getTranslations).toHaveBeenCalledWith({ locale: 'ko', namespace: 'Project' });
    expect(getProjects).toHaveBeenCalledWith({ locale: 'ko' });
    expect(data.portfolioButtonLabel).toBe('Download');
    expect(data.portfolioButtonUnavailableLabel).toBe('준비 중');
    expect(data.portfolioUrl).toBe('https://example.com/portfolio.pdf');
  });
});
