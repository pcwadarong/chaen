import { useTranslations } from 'next-intl';

import { ResumePageLoadingSkeleton } from '@/widgets/page-loading/ui/page-loading-skeletons';

/**
 * 이력 페이지 라우트 전환 중 즉시 노출하는 로딩 UI입니다.
 */
const ResumeLoading = () => {
  const t = useTranslations('Resume');

  return <ResumePageLoadingSkeleton loadingText={t('loading')} />;
};

export default ResumeLoading;
