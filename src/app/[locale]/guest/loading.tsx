import { useTranslations } from 'next-intl';
import React from 'react';

import { GuestPageLoadingSkeleton } from '@/widgets/page-loading/ui/page-loading-skeletons';

/**
 * 방명록 라우트 전환 중 즉시 노출하는 로딩 UI입니다.
 */
const GuestLoading = () => {
  const t = useTranslations('Guest');

  return <GuestPageLoadingSkeleton loadingText={t('loading')} />;
};

export default GuestLoading;
