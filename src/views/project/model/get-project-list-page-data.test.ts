import { getTranslations } from 'next-intl/server';
import { vi } from 'vitest';

import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getProjects } from '@/entities/project/api/list/get-projects';
import { getProjectListPageData } from '@/views/project/model/get-project-list-page-data';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

vi.mock('@/entities/project/api/list/get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-availability', () => ({
  getPdfFileAvailability: vi.fn(),
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
    vi.mocked(getPdfFileAvailability).mockResolvedValue(true);
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
    expect(getPdfFileAvailability).toHaveBeenCalledWith({ kind: 'portfolio' });
    expect(data.portfolioButtonLabel).toBe('Download');
    expect(data.portfolioButtonUnavailableLabel).toBe('준비 중');
    expect(data.portfolioDownloadHref).toBe('/api/pdf/portfolio');
  });

  it('프로젝트 목록 조회 실패 시 빈 초기 목록으로 폴백한다', async () => {
    const translation = ((key: string) => {
      if (key === 'portfolioDownload') return 'Download';
      if (key === 'portfolioDownloadUnavailable') return 'Unavailable';

      return key;
    }) as unknown as Awaited<ReturnType<typeof getTranslations>>;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getProjects).mockRejectedValue(new Error('temporary failure'));
    vi.mocked(getPdfFileAvailability).mockResolvedValue(false);
    vi.mocked(getPdfFileContent).mockResolvedValue(null);

    const data = await getProjectListPageData({ locale: 'ko' });

    expect(data.initialItems).toEqual([]);
    expect(data.initialCursor).toBeNull();
    expect(data.portfolioButtonLabel).toBe('Download');
    expect(data.portfolioButtonUnavailableLabel).toBe('Unavailable');
    expect(data.portfolioDownloadHref).toBeNull();
  });
});
