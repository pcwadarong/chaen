'use client';

import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type WorkListPageProps = {
  items: ProjectItem[];
};

/** 프로젝트 목록 페이지 컨테이너입니다. */
export const WorkListPage = ({ items }: WorkListPageProps) => {
  const t = useTranslations('Work');

  return (
    <main style={pageStyle}>
      <ProjectShowcase
        description={t('showcaseDescription')}
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
};
