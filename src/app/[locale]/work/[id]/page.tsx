import { notFound } from 'next/navigation';

import { findProjectItem } from '@/entities/project/model/project-items';
import { WorkDetailPage } from '@/views/work-detail';

type WorkDetailRouteProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
};

/**
 * 프로젝트 상세 라우트 엔트리입니다.
 */
const WorkDetailRoute = async ({ params }: WorkDetailRouteProps) => {
  const { id } = await params;
  const item = findProjectItem(id);

  if (!item) {
    notFound();
  }

  return <WorkDetailPage item={item} />;
};

export default WorkDetailRoute;
