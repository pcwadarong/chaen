import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getWorkListPageData } from '@/views/work-list';

import WorkRoute from './page';

vi.mock('@/views/work-list', () => ({
  getWorkListPageData: vi.fn(async () => ({
    initialCursor: null,
    initialItems: [],
    locale: 'ko',
    portfolioButtonLabel: 'Download portfolio',
    portfolioButtonUnavailableLabel: 'Portfolio unavailable',
    portfolioDownloadFileName: 'portfolio.pdf',
    portfolioUrl: 'https://example.com/portfolio.pdf',
  })),
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
    expect(getWorkListPageData).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.initialItems).toEqual([]);
    expect(element.props.initialCursor).toBeNull();
    expect(element.props.locale).toBe('ko');
    expect(element.props.portfolioButtonLabel).toBe('Download portfolio');
    expect(element.props.portfolioButtonUnavailableLabel).toBe('Portfolio unavailable');
    expect(element.props.portfolioDownloadFileName).toBeDefined();
    expect(element.props.portfolioUrl).toBe('https://example.com/portfolio.pdf');
  });
});
