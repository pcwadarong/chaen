import { useTranslations } from 'next-intl';

import type { ProjectListItem } from '@/entities/project/model/types';
import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';
import { ProjectFeed } from '@/widgets/project-feed/ui/project-feed';

export type ProjectListPageProps = {
  initialCursor: string | null;
  initialItems: ProjectListItem[];
  locale: string;
  portfolioButtonLabel: string;
  portfolioButtonUnavailableLabel: string;
  portfolioDownloadHref: string | null;
  portfolioDownloadFileName: string;
};

/** 프로젝트 목록 페이지 컨테이너입니다. */
export const ProjectListPage = ({
  initialCursor,
  initialItems,
  locale,
  portfolioButtonLabel,
  portfolioButtonUnavailableLabel,
  portfolioDownloadHref,
  portfolioDownloadFileName,
}: ProjectListPageProps) => {
  const t = useTranslations('Project');

  return (
    <PageShell hideAppFrameFooter>
      <PageHeader
        action={
          <DownloadFileButton
            fileName={portfolioDownloadFileName}
            href={portfolioDownloadHref}
            label={portfolioDownloadHref ? portfolioButtonLabel : portfolioButtonUnavailableLabel}
            mode="download"
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
