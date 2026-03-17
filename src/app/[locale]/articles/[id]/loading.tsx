import { useTranslations } from 'next-intl';

import { DetailPageShellLoadingSkeleton } from '@/widgets/page-loading/ui/page-loading-skeletons';

/**
 * 상세 shell이 아직 준비되지 않은 구간의 fallback입니다.
 * shell 이후의 아카이브/태그/관련 글은 페이지 내부 Suspense가 담당합니다.
 */
const ArticleDetailLoading = () => {
  const t = useTranslations('ArticleDetail');

  return <DetailPageShellLoadingSkeleton loadingText={t('loading')} />;
};

export default ArticleDetailLoading;
