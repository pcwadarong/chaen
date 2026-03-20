import { getTranslations } from 'next-intl/server';
import React from 'react';

import { GuestPageLoadingSkeleton } from '@/widgets/page-loading/ui/page-loading-skeletons';

/**
 * 방명록 라우트 전환 중 즉시 노출하는 로딩 UI입니다.
 */
const GuestLoading = async () => {
  const t = await getTranslations('Guest');

  return <GuestPageLoadingSkeleton loadingText={t('loading')} />;
};

export default GuestLoading;
