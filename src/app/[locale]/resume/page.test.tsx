import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getPdfFileContent } from '@/entities/pdf-file/api/get-pdf-file-content';
import { getPdfFileUrl } from '@/entities/pdf-file/api/get-pdf-file-url';

import ResumeRoute from './page';

vi.mock('@/entities/pdf-file/api/get-pdf-file-content', () => ({
  getPdfFileContent: vi.fn(async () => ({
    locale: 'ko',
    title: '안녕하세요 박채원입니다.',
    description: '서버 내용',
    body: '본문',
    download_button_label: '이력서 다운로드',
    download_unavailable_label: '이력서 준비 중',
    updated_at: '2026-03-02T00:00:00.000Z',
  })),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-url', () => ({
  getPdfFileUrl: vi.fn(async () => 'https://example.com/resume.pdf'),
}));

vi.mock('@/views/resume', () => ({
  ResumePage: function ResumePage() {
    return null;
  },
}));

describe('ResumeRoute', () => {
  it('이력서 뷰 엔트리와 다운로드 URL을 반환한다', async () => {
    const element = await ResumeRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ResumePage');
    expect(getPdfFileUrl).toHaveBeenCalledTimes(1);
    expect(getPdfFileContent).toHaveBeenCalledWith({
      locale: 'ko',
      kind: 'resume',
    });
    expect(element.props.resumeUrl).toBe('https://example.com/resume.pdf');
    expect(element.props.downloadFileName).toBeDefined();
    expect(element.props.content.title).toBe('안녕하세요 박채원입니다.');
  });
});
