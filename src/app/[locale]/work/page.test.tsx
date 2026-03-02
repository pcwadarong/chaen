import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { getProjects } from '@/entities/project/api/get-projects';

import WorkRoute from './page';

vi.mock('@/entities/project/api/get-projects', () => ({
  getProjects: vi.fn(async () => []),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    if (key === 'portfolioDownload') return 'Download portfolio';
    if (key === 'portfolioDownloadUnavailable') return 'Portfolio unavailable';

    return key;
  }),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-url', () => ({
  getPdfFileUrl: vi.fn(async () => 'https://example.com/portfolio.pdf'),
}));

vi.mock('@/views/work-list', () => ({
  WorkListPage: function WorkListPage() {
    return null;
  },
}));

describe('WorkRoute', () => {
  it('프로젝트 목록 뷰 엔트리와 포트폴리오 다운로드 props를 반환한다', async () => {
    const element = await WorkRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('WorkListPage');
    expect(getProjects).toHaveBeenCalledWith('ko');
    expect(getPdfFileUrl).toHaveBeenCalledTimes(1);
    expect(element.props.items).toEqual([]);
    expect(element.props.portfolioButtonLabel).toBe('Download portfolio');
    expect(element.props.portfolioButtonUnavailableLabel).toBe('Portfolio unavailable');
    expect(element.props.portfolioDownloadFileName).toBeDefined();
    expect(element.props.portfolioUrl).toBe('https://example.com/portfolio.pdf');
  });
});
