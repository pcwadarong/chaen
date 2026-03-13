import { getTranslations } from 'next-intl/server';
import React from 'react';
import { css } from 'styled-system/css';

import {
  deleteArticleAction,
  getArticleDetailArchivePageAction,
  incrementArticleViewCountAction,
} from '@/entities/article/api/article-actions';
import type {
  Article,
  ArticleArchivePage,
  ArticleListItem as ArticleListItemModel,
} from '@/entities/article/model/types';
import { ArticleListItem } from '@/entities/article/ui/article-list-item';
import type { ArticleCommentPage } from '@/entities/article-comment/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import type { AppLocale } from '@/i18n/routing';
import {
  resolvePublicContentPathSegment,
  resolvePublicContentPublishedAt,
} from '@/shared/lib/content/public-content';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/shared/lib/seo/structured-data';
import { AdminDetailActions } from '@/shared/ui/detail-page/admin-detail-actions';
import { DetailArchiveFeed } from '@/shared/ui/detail-page/archive/feed';
import { DetailMetaBar } from '@/shared/ui/detail-page/detail-meta-bar';
import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';
import { JsonLd } from '@/shared/ui/seo/JsonLd';
import { ArticleCommentsSection } from '@/widgets/article-comments';

type ArticleDetailPageProps = {
  archivePage: ArticleArchivePage;
  initialCommentsPage: ArticleCommentPage;
  isAdmin?: boolean;
  item: Article;
  locale: AppLocale;
  relatedArticles: ArticleListItemModel[];
};

type RelatedArticlesSectionProps = {
  items: ArticleListItemModel[];
  title: string;
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
 * 아티클 상세 하단의 관련 글 섹션을 렌더링합니다.
 */
const RelatedArticlesSection = ({ items, title }: RelatedArticlesSectionProps) => {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-articles-title" className={relatedArticlesSectionClass}>
      <h2 className={relatedArticlesTitleClass} id="related-articles-title">
        {title}
      </h2>
      <ol className={relatedArticlesListClass}>
        {items.map(article => (
          <li className={relatedArticlesItemClass} key={article.id}>
            <ArticleListItem article={article} />
          </li>
        ))}
      </ol>
    </section>
  );
};

/**
 * 아티클 상세 페이지 컨테이너입니다.
 */
export const ArticleDetailPage = async ({
  archivePage,
  initialCommentsPage,
  isAdmin = false,
  item,
  locale,
  relatedArticles,
}: ArticleDetailPageProps) => {
  const t = await getTranslations('ArticleDetail');
  const articlesT = await getTranslations('Articles');
  const detailUi = await getTranslations('DetailUi');
  const navigationT = await getTranslations('Navigation');
  const tagLabels = await getArticleTagLabels(item, locale);
  if (!item.publish_at) {
    throw new Error(`[articles] 공개 아티클 publish_at이 없습니다. id=${item.id}`);
  }
  const articlePathSegment = resolvePublicContentPathSegment(item);
  const publishedAt = resolvePublicContentPublishedAt(item);
  const publishedDate = publishedAt.slice(0, 10);
  const articlePath = buildLocalizedPathname({
    locale,
    pathname: `/articles/${articlePathSegment}`,
  });
  const structuredData = [
    buildBreadcrumbJsonLd([
      {
        name: navigationT('home'),
        path: buildLocalizedPathname({ locale }),
      },
      {
        name: navigationT('articles'),
        path: buildLocalizedPathname({ locale, pathname: '/articles' }),
      },
      {
        name: item.title,
        path: articlePath,
      },
    ]),
    buildArticleJsonLd({
      createdAt: item.created_at,
      description: item.description ?? t('emptySummary'),
      locale,
      path: articlePath,
      tags: tagLabels,
      thumbnailUrl: item.thumbnail_url,
      title: item.title,
      updatedAt: item.updated_at,
    }),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <DetailPageShell
        bottomContent={
          <>
            <ArticleCommentsSection
              articleId={item.id}
              initialPage={initialCommentsPage}
              locale={locale}
            />
            <RelatedArticlesSection items={relatedArticles} title={t('relatedArticlesTitle')} />
          </>
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
            actionSlot={
              isAdmin ? (
                <AdminDetailActions
                  deleteAction={deleteArticleAction.bind(null, {
                    articleId: item.id,
                    articleSlug: articlePathSegment,
                    locale,
                  })}
                  editHref={`/admin/articles/${item.id}/edit`}
                />
              ) : null
            }
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
            selectedPathSegment={articlePathSegment}
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
    </>
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

const relatedArticlesSectionClass = css({
  display: 'grid',
  gap: '4',
  mt: '12',
  pt: '8',
  borderTop: '[1px solid var(--colors-border)]',
});

const relatedArticlesTitleClass = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
  letterSpacing: '[-0.03em]',
});

const relatedArticlesListClass = css({
  listStyle: 'none',
  m: '0',
  p: '0',
  borderBottom: '[1px solid var(--colors-border)]',
});

const relatedArticlesItemClass = css({
  borderTop: '[1px solid var(--colors-border)]',
  _first: {
    borderTop: 'none',
  },
});
