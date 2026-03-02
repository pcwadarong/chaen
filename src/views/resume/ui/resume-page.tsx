import type { CSSProperties } from 'react';

import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';

type ResumePageProps = {
  content: PdfFileContent;
  downloadFileName: string;
  resumeUrl: string | null;
};

/**
 * 이력서 소개 페이지 컨테이너입니다.
 */
export const ResumePage = ({ content, downloadFileName, resumeUrl }: ResumePageProps) => (
  <main style={pageStyle}>
    <section style={panelStyle}>
      <h1 style={titleStyle}>{content.title}</h1>
      <p style={descriptionStyle}>{content.description}</p>
      <p style={bodyStyle}>{content.body}</p>
      <DownloadFileButton
        fileName={downloadFileName}
        href={resumeUrl}
        label={resumeUrl ? content.download_button_label : content.download_unavailable_label}
        mode="download"
      />
    </section>
  </main>
);

const pageStyle: CSSProperties = {
  width: 'min(960px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
};

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  padding: '1.75rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgb(var(--color-border) / 0.22)',
  backgroundColor: 'rgb(var(--color-surface) / 0.9)',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2.25rem, 5vw, 4rem)',
  lineHeight: 1.02,
  letterSpacing: '-0.04em',
};

const descriptionStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

const bodyStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.72,
};
