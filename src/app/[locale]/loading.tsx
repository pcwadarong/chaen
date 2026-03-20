import { useTranslations } from 'next-intl';
import React from 'react';

import { GenericPageLoadingSkeleton } from '@/widgets/page-loading/ui/page-loading-skeletons';

/**
 * locale 하위 라우트에 개별 loading.tsx가 없을 때 사용하는 전역 fallback입니다.
 */
const LocaleLoading = () => {
  const t = useTranslations('Common');

  return <GenericPageLoadingSkeleton loadingText={t('pageLoading')} />;
};

export default LocaleLoading;
