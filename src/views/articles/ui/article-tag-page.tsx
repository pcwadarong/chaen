import { useTranslations } from 'next-intl';
import React from 'react';

import { ArticlesInteractiveShell } from '@/views/articles/ui/articles-interactive-shell';
import type { ArticlesPageProps } from '@/views/articles/ui/articles-page';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

type ArticleTagPageProps = ArticlesPageProps;
type ArticleTagPageViewProps = ArticleTagPageProps & {
  activeTagLabel?: string;
};

/**
 * 특정 태그 전용 아티클 목록 페이지를 렌더링합니다.
 */
export const ArticleTagPage = ({
  activeTag,
  activeTagLabel,
  feedLocale,
  initialCursor,
  initialItems,
  locale,
  searchQuery,
}: ArticleTagPageViewProps) => {
  const t = useTranslations('Articles');
  const displayTag = activeTagLabel?.trim() || activeTag;

  return (
    <PageShell hideAppFrameFooter>
      <PageHeader
        description={t('tagPageDescription', {
          tag: displayTag,
        })}
        title={`#${displayTag}`}
      />
      <PageSection>
        <ArticlesInteractiveShell
          activeTag={activeTag}
          emptyText={t('emptyItems')}
          feedLocale={feedLocale}
          initialCursor={initialCursor}
          initialItems={initialItems}
          loadErrorText={t('loadError')}
          loadMoreEndText={t('loadMoreEnd')}
          loadingText={t('loading')}
          popularTagsDefaultLabel={t('popularTagsDefault')}
          popularTagsEmptyText={t('popularTagsEmpty')}
          popularTagsLoadingText={t('popularTagsLoading')}
          popularTagsTitle={t('popularTagsTitle')}
          query={searchQuery}
          retryText={t('retry')}
          searchClearText={t('searchClear')}
          searchPlaceholderText={t('searchPlaceholder')}
          searchSubmitText={t('searchSubmit')}
          showSearchFormInSidebar={false}
          showTagFilterInSidebar={false}
          tagLocale={locale}
          topTagFilterHrefMode="tag-page"
          topTagFilterSource="all"
          topTagFilterTitle={t('allTagsTitle')}
        />
      </PageSection>
    </PageShell>
  );
};
