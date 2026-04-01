import { render, screen } from '@testing-library/react';
import React from 'react';

import { MarkdownAttachment } from '@/shared/ui/markdown/markdown-attachment';

describe('MarkdownAttachment', () => {
  it('Under no host resolver, MarkdownAttachment must use the raw href as its download target', () => {
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

  it('Under a custom attachment resolver, MarkdownAttachment must use the resolved href', () => {
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
