'use client';

import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

import type { Project } from '@/entities/project/model/types';
import { ProjectFeed } from '@/features/project-feed/ui/project-feed';
import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';

export type WorkListPageProps = {
  initialCursor: string | null;
  initialItems: Project[];
  locale: string;
  portfolioButtonLabel: string;
  portfolioButtonUnavailableLabel: string;
  portfolioDownloadFileName: string;
  portfolioUrl: string | null;
};

/** 프로젝트 목록 페이지 컨테이너입니다. */
export const WorkListPage = ({
  initialCursor,
  initialItems,
  locale,
  portfolioButtonLabel,
  portfolioButtonUnavailableLabel,
  portfolioDownloadFileName,
  portfolioUrl,
}: WorkListPageProps) => {
  const t = useTranslations('Work');

  return (
    <main css={pageStyle}>
      <section css={resumeCtaStyle}>
        <DownloadFileButton
          fileName={portfolioDownloadFileName}
          href={portfolioUrl}
          label={portfolioUrl ? portfolioButtonLabel : portfolioButtonUnavailableLabel}
          mode="download"
        />
      </section>
      <ProjectFeed
        description={t('showcaseDescription')}
        emptyText={t('emptyProjects')}
        initialCursor={initialCursor}
        initialItems={initialItems}
        loadErrorText={t('loadError')}
        loadMoreEndText={t('loadMoreEnd')}
        loadingText={t('loading')}
        locale={locale}
        retryText={t('retry')}
        title={t('showcaseTitle')}
      />
    </main>
  );
};

const pageStyle = css`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: var(--space-12) var(--space-0) var(--space-20);
  display: grid;
  gap: var(--space-4);
`;

const resumeCtaStyle = css`
  display: flex;
  justify-content: flex-end;
`;
