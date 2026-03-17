import { getTranslations } from 'next-intl/server';
import { vi } from 'vitest';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileDownloadOptions } from '@/entities/pdf-file/api/get-pdf-file-download-options';
import { getProjects } from '@/entities/project/api/list/get-projects';
import { getProjectListPageData } from '@/views/project/model/get-project-list-page-data';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

vi.mock('@/entities/project/api/list/get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-download-options', () => ({
  getPdfFileDownloadOptions: vi.fn(),
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
    vi.mocked(getPdfFileDownloadOptions).mockResolvedValue([
      {
        assetKey: 'portfolio-ko',
        fileName: '박채원_포트폴리오.pdf',
        href: '/api/pdf/file/portfolio-ko',
        locale: 'ko',
      },
      {
        assetKey: 'portfolio-en',
        fileName: 'ParkChaewon-Portfolio.pdf',
        href: '/api/pdf/file/portfolio-en',
        locale: 'en',
      },
    ]);
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
    expect(getPdfFileDownloadOptions).toHaveBeenCalledWith('portfolio');
    expect(getPdfFileContent).toHaveBeenCalledWith({ kind: 'portfolio', locale: 'ko' });
    expect(data.portfolioButtonLabel).toBe('Download');
    expect(data.portfolioButtonUnavailableLabel).toBe('준비 중');
    expect(data.portfolioDownloadOptions).toEqual([
      {
        assetKey: 'portfolio-ko',
        fileName: '박채원_포트폴리오.pdf',
        href: '/api/pdf/file/portfolio-ko',
        locale: 'ko',
      },
      {
        assetKey: 'portfolio-en',
        fileName: 'ParkChaewon-Portfolio.pdf',
        href: '/api/pdf/file/portfolio-en',
        locale: 'en',
      },
    ]);
  });

  it('프로젝트 목록 조회 실패 시 빈 초기 목록으로 폴백한다', async () => {
    const translation = ((key: string) => {
      if (key === 'portfolioDownload') return 'Download';
      if (key === 'portfolioDownloadUnavailable') return 'Unavailable';

      return key;
    }) as unknown as Awaited<ReturnType<typeof getTranslations>>;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getProjects).mockRejectedValue(new Error('temporary failure'));
    vi.mocked(getPdfFileDownloadOptions).mockResolvedValue([
      {
        assetKey: 'portfolio-ko',
        fileName: '박채원_포트폴리오.pdf',
        href: null,
        locale: 'ko',
      },
      {
        assetKey: 'portfolio-en',
        fileName: 'ParkChaewon-Portfolio.pdf',
        href: null,
        locale: 'en',
      },
    ]);
    vi.mocked(getPdfFileContent).mockResolvedValue(null);

    const data = await getProjectListPageData({ locale: 'ko' });

    expect(data.initialItems).toEqual([]);
    expect(data.initialCursor).toBeNull();
    expect(data.portfolioButtonLabel).toBe('Download');
    expect(data.portfolioButtonUnavailableLabel).toBe('Unavailable');
    expect(data.portfolioDownloadOptions).toEqual([
      {
        assetKey: 'portfolio-ko',
        fileName: '박채원_포트폴리오.pdf',
        href: null,
        locale: 'ko',
      },
      {
        assetKey: 'portfolio-en',
        fileName: 'ParkChaewon-Portfolio.pdf',
        href: null,
        locale: 'en',
      },
    ]);
    expect(getPdfFileContent).toHaveBeenCalledWith({ kind: 'portfolio', locale: 'ko' });
  });
});
