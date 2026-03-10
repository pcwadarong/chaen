import { useTranslations } from 'next-intl';

import { DetailPageLoadingSkeleton } from '@/shared/ui/loading/route-loading';

/**
 * 아티클 상세 로딩 상태 UI입니다.
 */
const ArticleDetailLoading = () => {
  const t = useTranslations('ArticleDetail');

  return <DetailPageLoadingSkeleton loadingText={t('loading')} />;
};

export default ArticleDetailLoading;
