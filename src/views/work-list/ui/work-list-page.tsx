import type { CSSProperties } from 'react';

import type { ProjectItem } from '@/entities/project/model/project-items';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type WorkListPageProps = {
  items: ProjectItem[];
};

/** 프로젝트 목록 페이지 컨테이너입니다. */
export const WorkListPage = ({ items }: WorkListPageProps) => (
  <main style={pageStyle}>
    <ProjectShowcase
      description="프로젝트 리스트는 홈의 일부 프리뷰와 달리 전체 카드 컬렉션을 보여주는 독립 페이지입니다."
      items={items}
      title="Project archive"
    />
  </main>
);

const pageStyle: CSSProperties = {
  width: 'min(1120px, calc(100% - 2rem))',
  margin: '0 auto',
  padding: '3rem 0 5rem',
};
