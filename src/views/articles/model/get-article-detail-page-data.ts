import { getResolvedArticle } from '@/entities/article/api/detail/get-article';
import {
  getArticleDetailList,
  getArticleDetailListWindow,
} from '@/entities/article/api/detail/get-article-detail-list';
import { getRelatedArticles } from '@/entities/article/api/detail/get-related-articles';
import type { Article, ArticleArchivePage, ArticleListItem } from '@/entities/article/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';

type GetArticleDetailPageDataInput = {
  articleSlug: string;
  locale: string;
};

type GetArticleDetailArchivePageDataInput = {
  item: Article | null;
  locale: string;
};

type GetArticleDetailRelatedArticlesDataInput = {
  articleId: string | null | undefined;
  locale: string;
};

type GetArticleTagLabelsInput = {
  item: Article | null;
  locale: string;
};

export type ArticleDetailShellData = Awaited<ReturnType<typeof getResolvedArticle>>;

type CurrentArticleArchiveItem = Parameters<typeof getArticleDetailListWindow>[0]['currentItem'];

const EMPTY_ARTICLE_ARCHIVE_PAGE: ArticleArchivePage = {
  items: [],
  nextCursor: null,
};

/**
 * 상세 아티클을 public archive 요약 shape로 좁힙니다.
 */
const toCurrentArticleArchiveItem = (item: Article | null): CurrentArticleArchiveItem | null => {
  if (!item?.publish_at || !item.slug) return null;

  return {
    description: item.description,
    id: item.id,
    publish_at: item.publish_at,
    slug: item.slug,
    title: item.title,
  };
};

/**
 * 상세 아티클 태그를 locale 기준 표시 라벨로 변환합니다.
 */
export const getArticleTagLabels = async ({
  item,
  locale,
}: GetArticleTagLabelsInput): Promise<string[]> => {
  const tags = item?.tags ?? [];

  if (tags.length === 0) return [];

  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: tags,
  }).catch(error => {
    console.error('[articles] getTagLabelMapBySlugs failed for locale', {
      error,
      locale,
      tags,
    });

    return {
      data: new Map<string, string>(),
      schemaMissing: true,
    };
  });

  if (tagLabelMap.schemaMissing) return tags;

  return tags.map(tag => tagLabelMap.data.get(tag) ?? tag);
};

/**
 * 아티클 상세 본문 shell에 필요한 최소 데이터를 조회합니다.
 */
export const getArticleDetailShellData = ({
  articleSlug,
  locale,
}: GetArticleDetailPageDataInput): Promise<ArticleDetailShellData> =>
  getResolvedArticle(articleSlug, locale);

/**
 * 아티클 상세 좌측 아카이브를 현재 글을 포함한 초기 slice로 조회합니다.
 */
export const getArticleDetailArchivePageData = async ({
  item,
  locale,
}: GetArticleDetailArchivePageDataInput): Promise<ArticleArchivePage> => {
  const currentArchiveItem = toCurrentArticleArchiveItem(item);

  if (!currentArchiveItem) {
    return getArticleDetailList({ locale }).catch(error => {
      console.error('[articles] getArticleDetailList failed for locale', {
        error,
        locale,
      });

      return EMPTY_ARTICLE_ARCHIVE_PAGE;
    });
  }

  return getArticleDetailListWindow({
    currentItem: currentArchiveItem,
    locale,
  }).catch(error => {
    console.error('[articles] getArticleDetailListWindow failed for locale', {
      error,
      locale,
    });

    return {
      items: [currentArchiveItem],
      nextCursor: null,
    };
  });
};

/**
 * 아티클 상세 하단의 관련 글 목록을 조회합니다.
 */
export const getArticleDetailRelatedArticlesData = async ({
  articleId,
  locale,
}: GetArticleDetailRelatedArticlesDataInput): Promise<ArticleListItem[]> => {
  if (!articleId) return [];

  return getRelatedArticles({
    articleId,
    locale,
  }).catch(() => []);
};
