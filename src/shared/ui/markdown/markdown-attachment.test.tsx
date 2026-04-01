import { render, screen } from '@testing-library/react';
import React from 'react';

import { MarkdownAttachment } from '@/shared/ui/markdown/markdown-attachment';

describe('MarkdownAttachment', () => {
  it('host resolver가 없으면, MarkdownAttachment는 원본 href를 다운로드 대상으로 사용해야 한다', () => {
    render(
      <MarkdownAttachment
        fileName="resume.pdf"
        fileSize={2048}
        href="https://example.com/resume.pdf"
      />,
    );

    expect(screen.getByRole('link', { name: '다운로드' }).getAttribute('href')).toBe(
      'https://example.com/resume.pdf',
    );
  });

  it('custom attachment resolver가 주어지면, MarkdownAttachment는 resolver가 반환한 href를 사용해야 한다', () => {
    render(
      <MarkdownAttachment
        fileName="resume.pdf"
        fileSize={2048}
        href="https://example.com/resume.pdf"
        resolveAttachmentHref={({ fileName }) => `/download/${fileName}`}
      />,
    );

    expect(screen.getByRole('link', { name: '다운로드' }).getAttribute('href')).toBe(
      '/download/resume.pdf',
    );
  });
});
