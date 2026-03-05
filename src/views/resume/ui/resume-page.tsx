'use client';

import { css } from '@emotion/react';

import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';

export type ResumePageProps = {
  content: PdfFileContent;
  downloadFileName: string;
  resumeUrl: string | null;
};

/**
 * 이력서 소개 페이지 컨테이너입니다.
 */
export const ResumePage = ({ content, downloadFileName, resumeUrl }: ResumePageProps) => (
  <main css={pageStyle}>
    <section css={panelStyle}>
      <h1 css={titleStyle}>{content.title}</h1>
      <p css={descriptionStyle}>{content.description}</p>
      <p css={bodyStyle}>{content.body}</p>
      <DownloadFileButton
        fileName={downloadFileName}
        href={resumeUrl}
        label={resumeUrl ? content.download_button_label : content.download_unavailable_label}
        mode="download"
      />
    </section>
  </main>
);

const pageStyle = css`
  width: min(960px, calc(100% - 2rem));
  margin: 0 auto;
  padding: var(--space-12) var(--space-0) var(--space-20);
`;

const panelStyle = css`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-7);
  border-radius: var(--radius-lg);
  border: 1px solid rgb(var(--color-border) / 0.22);
  background-color: rgb(var(--color-surface) / 0.9);
`;

const titleStyle = css`
  font-size: clamp(2.25rem, 5vw, 4rem);
  line-height: var(--line-height-100);
  letter-spacing: -0.04em;
`;

const descriptionStyle = css`
  color: rgb(var(--color-muted));
`;

const bodyStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-170);
`;
