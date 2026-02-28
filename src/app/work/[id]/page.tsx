import { notFound } from 'next/navigation';

import { findProjectItem } from '@/entities/project/model/project-items';
import { WorkDetailPage } from '@/views/work-detail';

type WorkDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const WorkDetailRoute = async ({ params }: WorkDetailRouteProps) => {
  const { id } = await params;
  const item = findProjectItem(id);

  if (!item) notFound();

  return <WorkDetailPage item={item} />;
};

export default WorkDetailRoute;
