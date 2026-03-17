import { useTranslations } from 'next-intl';

import { ProjectPageLoadingSkeleton } from '@/widgets/page-loading/ui/page-loading-skeletons';

/**
 * 프로젝트 목록 라우트 전환 중 즉시 노출하는 로딩 UI입니다.
 */
const ProjectLoading = () => {
  const t = useTranslations('Project');

  return <ProjectPageLoadingSkeleton loadingText={t('loading')} />;
};

export default ProjectLoading;
