// @vitest-environment node

import { getTranslations } from 'next-intl/server';
import { vi } from 'vitest';

import { getProjects } from '@/entities/project/api/list/get-projects';
import { getProjectListPageData } from '@/views/project/model/get-project-list-page-data';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

vi.mock('@/entities/project/api/list/get-projects', () => ({
  getProjects: vi.fn(),
}));

describe('getProjectListPageData', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('목록/PDF 본문/번역 데이터를 조합해 반환한다', async () => {
    const translation = ((key: string) => {
      if (key === 'portfolioDownload') return 'Download';
      if (key === 'portfolioDownloadUnavailable') return 'Unavailable';

      return key;
    }) as unknown as Awaited<ReturnType<typeof getTranslations>>;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getProjects).mockResolvedValue({ items: [], nextCursor: null });

    const data = await getProjectListPageData({ locale: 'ko' });

    expect(getTranslations).toHaveBeenCalledWith({ locale: 'ko', namespace: 'Project' });
    expect(getProjects).toHaveBeenCalledWith({ locale: 'ko' });
    expect(data.portfolioButtonLabel).toBe('Download');
    expect(data.portfolioButtonUnavailableLabel).toBe('Unavailable');
  });

  it('프로젝트 목록 조회 실패 시 빈 초기 목록으로 폴백한다', async () => {
    const translation = ((key: string) => {
      if (key === 'portfolioDownload') return 'Download';
      if (key === 'portfolioDownloadUnavailable') return 'Unavailable';

      return key;
    }) as unknown as Awaited<ReturnType<typeof getTranslations>>;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getProjects).mockRejectedValue(new Error('temporary failure'));

    const data = await getProjectListPageData({ locale: 'ko' });

    expect(data.initialItems).toEqual([]);
    expect(data.initialCursor).toBeNull();
    expect(data.portfolioButtonLabel).toBe('Download');
    expect(data.portfolioButtonUnavailableLabel).toBe('Unavailable');
  });

  it('프로젝트 번역과 목록만으로 화면 데이터를 반환한다', async () => {
    const translation = ((key: string) => {
      if (key === 'portfolioDownload') return 'Download';
      if (key === 'portfolioDownloadUnavailable') return 'Unavailable';

      return key;
    }) as unknown as Awaited<ReturnType<typeof getTranslations>>;
    vi.mocked(getTranslations).mockResolvedValue(translation);
    vi.mocked(getProjects).mockResolvedValue({ items: [], nextCursor: null });

    await expect(getProjectListPageData({ locale: 'ko' })).resolves.toEqual({
      initialCursor: null,
      initialItems: [],
      locale: 'ko',
      portfolioButtonLabel: 'Download',
      portfolioButtonUnavailableLabel: 'Unavailable',
    });
  });
});
