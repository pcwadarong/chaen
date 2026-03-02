'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { Project } from '@/entities/project/model/types';
import { DownloadFileButton } from '@/shared/ui/download-file-button/download-file-button';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type WorkListPageProps = {
  items: Project[];
  portfolioButtonLabel: string;
  portfolioButtonUnavailableLabel: string;
  portfolioDownloadFileName: string;
  portfolioUrl: string | null;
};

/** 프로젝트 목록 페이지 컨테이너입니다. */
export const WorkListPage = ({
  items,
  portfolioButtonLabel,
  portfolioButtonUnavailableLabel,
  portfolioDownloadFileName,
  portfolioUrl,
}: WorkListPageProps) => {
  const t = useTranslations('Work');

  return (
    <main style={pageStyle}>
      <section style={resumeCtaStyle}>
        <DownloadFileButton
          fileName={portfolioDownloadFileName}
          href={portfolioUrl}
          label={portfolioUrl ? portfolioButtonLabel : portfolioButtonUnavailableLabel}
          mode="download"
        />
      </section>
      <ProjectShowcase
        description={t('showcaseDescription')}
        emptyText={t('emptyProjects')}
        items={items}
        title={t('showcaseTitle')}
      />
    </main>
  );
};

const pageStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
  display: 'grid',
  gap: '1rem',
};

const resumeCtaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};
