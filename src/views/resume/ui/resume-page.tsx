'use client';

import { css } from '@emotion/react';

import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';
import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';

export type ResumePageProps = {
  content: PdfFileContent;
  downloadFileName: string;
  resumeUrl: string | null;
};

/**
 * 이력서 소개 페이지 컨테이너입니다.
 */
export const ResumePage = ({ content, downloadFileName, resumeUrl }: ResumePageProps) => (
  <PageShell width="compact">
    <PageHeader
      action={
        <DownloadFileButton
          fileName={downloadFileName}
          href={resumeUrl}
          label={resumeUrl ? content.download_button_label : content.download_unavailable_label}
          mode="download"
        />
      }
      description={content.description}
      title={content.title}
    />
    <PageSection>
      <p css={bodyStyle}>{content.body}</p>
    </PageSection>
  </PageShell>
);

const bodyStyle = css`
  white-space: pre-wrap;
  line-height: var(--line-height-170);
`;
