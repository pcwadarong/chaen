import { useTranslations } from 'next-intl';
import React from 'react';

import type { ProjectListItem } from '@/entities/project/model/types';
import { DeferredPdfDownloadPopover } from '@/shared/ui/pdf-download-popover/deferred-pdf-download-popover';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';
import { ProjectFeed } from '@/widgets/project-feed/ui/project-feed';

export type ProjectListPageProps = {
  initialCursor: string | null;
  initialItems: ProjectListItem[];
  locale: string;
  portfolioButtonLabel: string;
  portfolioButtonUnavailableLabel: string;
};

/** 프로젝트 목록 페이지 컨테이너입니다. */
export const ProjectListPage = ({
  initialCursor,
  initialItems,
  locale,
  portfolioButtonLabel,
  portfolioButtonUnavailableLabel,
}: ProjectListPageProps) => {
  const t = useTranslations('Project');

  return (
    <PageShell>
      <PageHeader
        action={
          <DeferredPdfDownloadPopover
            kind="portfolio"
            label={portfolioButtonLabel}
            source="project-page"
            unavailableLabel={portfolioButtonUnavailableLabel}
          />
        }
        description={t('showcaseDescription')}
        title={t('showcaseTitle')}
      />
      <PageSection>
        <ProjectFeed
          emptyText={t('emptyProjects')}
          initialCursor={initialCursor}
          initialItems={initialItems}
          loadErrorText={t('loadError')}
          loadMoreEndText={t('loadMoreEnd')}
          loadingText={t('loading')}
          locale={locale}
          retryText={t('retry')}
        />
      </PageSection>
    </PageShell>
  );
};
