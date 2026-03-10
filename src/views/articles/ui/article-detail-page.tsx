import { getTranslations } from 'next-intl/server';
import React from 'react';
import { css } from 'styled-system/css';

import {
  getArticleDetailArchivePageAction,
  incrementArticleViewCountAction,
} from '@/entities/article/api/article-actions';
import type { Article, ArticleArchivePage } from '@/entities/article/model/types';
import type { ArticleCommentPage } from '@/entities/article-comment/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { DetailArchiveFeed } from '@/shared/ui/detail-page/archive/feed';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';
import { ArticleCommentsSection } from '@/widgets/article-comments';

type ArticleDetailPageProps = {
  archivePage: ArticleArchivePage;
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

  if (tagLabelMap.schemaMissing) return item.tags ?? [];

  return (item.tags ?? []).map(tag => tagLabelMap.data.get(tag) ?? tag);
};

/**
 * 아티클 상세 페이지 컨테이너입니다.
 */
export const ArticleDetailPage = async ({
  archivePage,
  initialCommentsPage,
  item,
  locale,
}: ArticleDetailPageProps) => {
  const t = await getTranslations('ArticleDetail');
  const articlesT = await getTranslations('Articles');
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
          trackViewAction={incrementArticleViewCountAction.bind(null, {
            articleId: item.id,
          })}
          viewCount={Number(item.view_count ?? 0)}
          viewCountLabel={detailUi('viewCount')}
        />
      }
      sidebarContent={
        <DetailArchiveFeed
          emptyText={detailUi('emptyArchive')}
          hrefBasePath="/articles"
          initialPage={archivePage}
          loadErrorText={articlesT('loadError')}
          loadPageAction={getArticleDetailArchivePageAction}
          loadMoreEndText={articlesT('loadMoreEnd')}
          loadingText={articlesT('loading')}
          locale={locale}
          retryText={articlesT('retry')}
          selectedId={item.id}
        />
      }
      sidebarLabel={t('archiveLabel')}
      tagContent={
        tagLabels.length > 0 ? (
          <ul aria-label={t('tagSection')} className={tagListClass}>
            {tagLabels.map(tagLabel => (
              <li className={tagItemClass} key={tagLabel}>
                <span className={tagButtonClass}>#{tagLabel}</span>
              </li>
            ))}
          </ul>
        ) : undefined
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
  listStyle: 'none',
  p: '0',
  m: '0',
  '@media (min-width: 961px)': {
    gap: '3',
  },
});

const tagItemClass = css({
  display: 'block',
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
