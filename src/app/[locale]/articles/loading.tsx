import { useTranslations } from 'next-intl';

import { ArticlesPageLoadingSkeleton } from '@/widgets/page-loading/ui/page-loading-skeletons';

/**
 * 아티클 목록 라우트 전환 중 즉시 노출하는 로딩 UI입니다.
 */
const ArticlesLoading = () => {
  const t = useTranslations('Articles');

  return <ArticlesPageLoadingSkeleton loadingText={t('loading')} />;
};

export default ArticlesLoading;
