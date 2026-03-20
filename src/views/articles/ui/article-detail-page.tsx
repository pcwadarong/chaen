import { useTranslations } from 'next-intl';
import React, { Suspense } from 'react';
import { css } from 'styled-system/css';

import type {
  Article,
  ArticleArchivePage,
  ArticleListItem as ArticleListItemModel,
} from '@/entities/article/model/types';
import { ArticleListItem } from '@/entities/article/ui/article-list-item';
import { getArticleDetailArchivePageAction } from '@/features/browse-article-archive/api/get-article-archive-page';
import { deleteArticleAction } from '@/features/manage-article/api/delete-article';
import { incrementArticleViewCountAction } from '@/features/track-article-view/api/increment-article-view-count-action';
import type { AppLocale } from '@/i18n/routing';
import {
  resolvePublicContentPathSegment,
  resolvePublicContentPublishedAt,
} from '@/shared/lib/content/public-content';
import { buildLocalizedPathname } from '@/shared/lib/seo/metadata';
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/shared/lib/seo/structured-data';
import { JsonLd } from '@/shared/ui/seo/JsonLd';
import { ArticleCommentsSection } from '@/widgets/article-comments';
import { DetailArchiveFeed } from '@/widgets/detail-page/archive/feed';
import { AdminDetailActionsGate } from '@/widgets/detail-page/ui/admin-detail-actions-gate';
import { DetailMetaBar } from '@/widgets/detail-page/ui/detail-meta-bar';
import {
  DetailRelatedArticlesSkeleton,
  DetailTagListSkeleton,
} from '@/widgets/detail-page/ui/detail-page-section-skeletons';
import { DetailPageShell } from '@/widgets/detail-page/ui/detail-page-shell';

type ArticleDetailPageProps = {
  initialArchivePage: ArticleArchivePage;
  item: Article;
  locale: AppLocale;
  relatedArticlesPromise: Promise<ArticleListItemModel[]>;
  tagLabelsPromise: Promise<string[]>;
};

type RelatedArticlesSectionProps = {
  items: ArticleListItemModel[];
  title: string;
};

type ArticleArchiveSidebarProps = {
  currentItem: Article;
  emptyText: string;
  initialPage: ArticleArchivePage;
  loadErrorText: string;
  loadMoreEndText: string;
  loadingText: string;
  locale: AppLocale;
  retryText: string;
  selectedPathSegment: string;
};

type ArticleTagListProps = {
  ariaLabel: string;
  tagLabelsPromise: Promise<string[]>;
};

type DeferredRelatedArticlesSectionProps = {
  relatedArticlesPromise: Promise<ArticleListItemModel[]>;
  title: string;
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
 * 아티클 상세 좌측 아카이브를 비동기 경계 안에서 렌더링합니다.
 */
const ArticleArchiveSidebar = ({
  currentItem,
  emptyText,
  initialPage,
  loadErrorText,
  loadMoreEndText,
  loadingText,
  locale,
  retryText,
  selectedPathSegment,
}: ArticleArchiveSidebarProps) => (
  <DetailArchiveFeed
    activeItemViewportOffsetRatio={0.25}
    currentItem={currentItem}
    emptyText={emptyText}
    hrefBasePath="/articles"
    initialPage={initialPage}
    loadErrorText={loadErrorText}
    loadPageAction={getArticleDetailArchivePageAction}
    loadMoreEndText={loadMoreEndText}
    loadingText={loadingText}
    locale={locale}
    pinCurrentItemToTop={false}
    retryText={retryText}
    selectedPathSegment={selectedPathSegment}
  />
);

/**
 * 아티클 상세 태그 목록을 비동기 경계 안에서 렌더링합니다.
 */
const ArticleTagList = async ({ ariaLabel, tagLabelsPromise }: ArticleTagListProps) => {
  const tagLabels = await tagLabelsPromise;

  if (tagLabels.length === 0) return null;

  return (
    <ul aria-label={ariaLabel} className={tagListClass}>
      {tagLabels.map(tagLabel => (
        <li className={tagItemClass} key={tagLabel}>
          <span className={tagButtonClass}>#{tagLabel}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * 아티클 상세 하단 관련 글 섹션을 비동기 경계 안에서 렌더링합니다.
 */
const DeferredRelatedArticlesSection = async ({
  relatedArticlesPromise,
  title,
}: DeferredRelatedArticlesSectionProps) => {
  const relatedArticles = await relatedArticlesPromise;

  return <RelatedArticlesSection items={relatedArticles} title={title} />;
};

/**
 * 아티클 상세 페이지를 렌더링합니다.
 *
 * @param props - 상세 페이지 전체 구성에 필요한 데이터 묶음입니다.
 * @param props.initialArchivePage - 현재 아티클을 포함한 좌측 아카이브 초기 window입니다.
 * `DetailArchiveFeed`의 첫 seed로 사용됩니다.
 * @param props.item - 본문, 메타데이터, 액션 영역에 사용할 현재 아티클입니다.
 * @param props.locale - 경로, 구조화 데이터, 번역 문자열에 사용할 locale입니다.
 * @param props.relatedArticlesPromise - 하단 관련 글 섹션이 `Suspense` 경계 안에서 소비할 promise입니다.
 * @param props.tagLabelsPromise - 태그 표시 라벨이 `Suspense` 경계 안에서 소비할 promise입니다.
 * @returns 아티클 상세 전체 JSX 엘리먼트를 반환합니다.
 */
export const ArticleDetailPage = ({
  initialArchivePage,
  item,
  locale,
  relatedArticlesPromise,
  tagLabelsPromise,
}: ArticleDetailPageProps) => {
  const t = useTranslations('ArticleDetail');
  const articlesT = useTranslations('Articles');
  const detailUi = useTranslations('DetailUi');
  const navigationT = useTranslations('Navigation');
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
      tags: item.tags ?? [],
      thumbnailUrl: item.thumbnail_url,
      title: item.title,
      updatedAt: item.updated_at,
    }),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <DetailPageShell
        content={item.content}
        emptyArchiveText={detailUi('emptyArchive')}
        emptyContentText={t('emptyContent')}
        guestbookCtaText={detailUi('leaveGuestbookMessage')}
        heroDescription={item.description ?? t('emptySummary')}
        hideAppFrameFooter
        locale={locale}
        metaBar={
          <DetailMetaBar
            copyFailedText={detailUi('copyFailed')}
            copiedText={detailUi('shareCopied')}
            locale={locale}
            primaryMetaScreenReaderText={`${t('publishedAtLabel')} ${publishedDate}`}
            primaryMetaText={publishedDate}
            shareText={detailUi('share')}
            actionSlot={
              <AdminDetailActionsGate
                deleteAction={deleteArticleAction.bind(null, {
                  articleId: item.id,
                  articleSlug: articlePathSegment,
                  locale,
                })}
                editHref={`/admin/articles/${item.id}/edit`}
              />
            }
            trackViewAction={incrementArticleViewCountAction.bind(null, {
              articleId: item.id,
            })}
            trackViewStorageKey={`article:${item.id}`}
            viewCount={Number(item.view_count ?? 0)}
            viewCountLabel={detailUi('viewCount')}
          />
        }
        sidebarContent={
          <ArticleArchiveSidebar
            currentItem={item}
            emptyText={detailUi('emptyArchive')}
            initialPage={initialArchivePage}
            loadErrorText={articlesT('loadError')}
            loadMoreEndText={articlesT('loadMoreEnd')}
            loadingText={articlesT('loading')}
            locale={locale}
            retryText={articlesT('retry')}
            selectedPathSegment={articlePathSegment}
          />
        }
        sidebarLabel={t('archiveLabel')}
        tagContent={
          (item.tags?.length ?? 0) > 0 ? (
            <Suspense fallback={<DetailTagListSkeleton />}>
              <ArticleTagList ariaLabel={t('tagSection')} tagLabelsPromise={tagLabelsPromise} />
            </Suspense>
          ) : undefined
        }
        title={item.title}
        bottomContent={
          <>
            <ArticleCommentsSection articleId={item.id} locale={locale} />
            <Suspense fallback={<DetailRelatedArticlesSkeleton />}>
              <DeferredRelatedArticlesSection
                relatedArticlesPromise={relatedArticlesPromise}
                title={t('relatedArticlesTitle')}
              />
            </Suspense>
          </>
        }
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
