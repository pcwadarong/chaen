import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';
import { getProjects } from '@/entities/project/api/get-projects';

import WorkRoute from './page';

vi.mock('@/entities/project/api/get-projects', () => ({
  getProjects: vi.fn(async () => []),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(async () => ({
    locale: 'ko',
    title: '안녕하세요 박채원입니다.',
    description: '서버 내용',
    body: '본문',
    download_button_label: '포트폴리오 다운로드',
    download_unavailable_label: '포트폴리오 준비 중',
    updated_at: '2026-03-02T00:00:00.000Z',
  })),
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
    expect(getPdfFileContent).toHaveBeenCalledWith('ko');
    expect(element.props.items).toEqual([]);
    expect(element.props.portfolioButtonLabel).toBe('포트폴리오 다운로드');
    expect(element.props.portfolioButtonUnavailableLabel).toBe('포트폴리오 준비 중');
    expect(element.props.portfolioDownloadFileName).toBeDefined();
    expect(element.props.portfolioUrl).toBe('https://example.com/portfolio.pdf');
  });
});
