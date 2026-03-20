import React from 'react';

import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';
import { DeferredPdfDownloadPopover } from '@/shared/ui/pdf-download-popover/deferred-pdf-download-popover';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

export type ResumePageProps = {
  content: PdfFileContent;
  unavailableLabel: string;
};

/**
 * 이력서 소개 페이지 컨테이너입니다.
 */
export const ResumePage = ({ content, unavailableLabel }: ResumePageProps) => (
  <PageShell width="compact">
    <PageHeader
      action={
        <DeferredPdfDownloadPopover
          kind="resume"
          label={content.download_button_label}
          source="resume-page"
          unavailableLabel={unavailableLabel}
        />
      }
      description={content.description}
      title={content.title}
    />
    <PageSection>
      <MarkdownRenderer locale={content.locale} markdown={content.body} />
    </PageSection>
  </PageShell>
);
