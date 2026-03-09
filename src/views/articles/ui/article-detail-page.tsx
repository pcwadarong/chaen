import { getTranslations } from 'next-intl/server';
import React from 'react';
import { css } from 'styled-system/css';

import type { Article, ArticleDetailListItem } from '@/entities/article/model/types';
import type { ArticleCommentPage } from '@/entities/article-comment/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { buildDetailArchiveLinkItems } from '@/shared/ui/detail-page/build-detail-archive-link-items';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';
import { ArticleCommentsSection } from '@/widgets/article-comments';

type ArticleDetailPageProps = {
  archiveItems: ArticleDetailListItem[];
  initialCommentsPage: ArticleCommentPage;
  item: Article;
  locale: string;
};

/**
 * 아티클에 연결된 태그 목록을 locale에 맞는 라벨로 변환합니다.
 */
const getArticleTagLabels = async (item: Article, locale: string) => {
  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: item.tags ?? [],
  });

  if (tagLabelMap.schemaMissing) {
    throw new Error('[articles] 태그 label schema가 없습니다.');
  }

  return (item.tags ?? []).map(tag => tagLabelMap.data.get(tag) ?? tag);
};

/**
 * 아티클 상세 페이지 컨테이너입니다.
 */
export const ArticleDetailPage = async ({
  archiveItems,
  initialCommentsPage,
  item,
  locale,
}: ArticleDetailPageProps) => {
  const t = await getTranslations('ArticleDetail');
  const detailUi = await getTranslations('DetailUi');
  const tagLabels = await getArticleTagLabels(item, locale);
  const publishedDate = item.created_at.slice(0, 10);

  return (
    <DetailPageShell
      bottomContent={
        <ArticleCommentsSection
          articleId={item.id}
          initialPage={initialCommentsPage}
          locale={locale}
        />
      }
      content={item.content}
      emptyArchiveText={detailUi('emptyArchive')}
      emptyContentText={t('emptyContent')}
      guestbookCtaText={detailUi('leaveGuestbookMessage')}
      heroDescription={item.description ?? t('emptySummary')}
      hideAppFrameFooter
      metaBar={
        <DetailMetaBar
          copyFailedText={detailUi('copyFailed')}
          copiedText={detailUi('shareCopied')}
          locale={locale}
          primaryMetaScreenReaderText={`${t('publishedAtLabel')} ${publishedDate}`}
          primaryMetaText={publishedDate}
          shareText={detailUi('share')}
          viewCount={Number(item.view_count ?? 0)}
          viewCountLabel={detailUi('viewCount')}
          viewEndpoint={`/api/articles/${item.id}/views`}
        />
      }
      sidebarItems={buildDetailArchiveLinkItems({
        getHref: archiveItem => `/articles/${archiveItem.id}`,
        items: archiveItems,
        locale,
        selectedId: item.id,
      })}
      sidebarLabel={t('archiveLabel')}
      tagContent={
        <div aria-label={t('tagSection')} className={tagListClass}>
          {tagLabels.length > 0 ? (
            tagLabels.map(tagLabel => (
              <button aria-disabled="true" className={tagButtonClass} key={tagLabel} type="button">
                #{tagLabel}
              </button>
            ))
          ) : (
            <button aria-disabled="true" className={tagButtonClass} type="button">
              #{t('noTags')}
            </button>
          )}
        </div>
      }
      title={item.title}
    />
  );
};

const tagListClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '2',
  '@media (min-width: 961px)': {
    gap: '3',
  },
});

const tagButtonClass = css({
  px: '3',
  py: '[0.35rem]',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
  fontSize: 'sm',
  lineHeight: 'tight',
  color: 'muted',
});
