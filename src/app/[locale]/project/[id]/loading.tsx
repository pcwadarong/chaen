import { useTranslations } from 'next-intl';

import { DetailPageLoadingSkeleton } from '@/shared/ui/loading/route-loading';

/**
 * 프로젝트 상세 로딩 상태 UI입니다.
 */
const ProjectDetailLoading = () => {
  const t = useTranslations('ProjectDetail');

  return <DetailPageLoadingSkeleton loadingText={t('loading')} />;
};

export default ProjectDetailLoading;
