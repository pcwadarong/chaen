import { render, screen } from '@testing-library/react';
import React from 'react';

import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';

describe('DownloadFileButton', () => {
  it('href가 있으면 열기 모드에서 링크로 렌더링한다', () => {
    render(<DownloadFileButton href="https://chaen.dev/resume.pdf" label="이력서 보기" />);

    const link = screen.getByRole('link', { name: '이력서 보기' });

    expect(link.getAttribute('href')).toBe('https://chaen.dev/resume.pdf');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('download 모드에서는 다운로드 속성을 포함한 링크로 렌더링한다', () => {
    render(
      <DownloadFileButton
        fileName="resume.pdf"
        href="https://chaen.dev/resume.pdf"
        label="이력서 다운로드"
        mode="download"
      />,
    );

    const link = screen.getByRole('link', { name: '이력서 다운로드' });

    expect(link.getAttribute('download')).toBe('resume.pdf');
  });

  it('href가 없으면 비활성 버튼으로 렌더링한다', () => {
    render(<DownloadFileButton href={null} label="준비 중" />);

    const button = screen.getByRole('button', { name: '준비 중' });

    expect(button).toHaveProperty('disabled', true);
  });
});
