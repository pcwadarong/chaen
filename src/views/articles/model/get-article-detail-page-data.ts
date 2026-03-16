import { getResolvedArticle } from '@/entities/article/api/detail/get-article';
import { getArticleDetailList } from '@/entities/article/api/detail/get-article-detail-list';
import { getRelatedArticles } from '@/entities/article/api/detail/get-related-articles';
import type {
  Article,
  ArticleArchivePage,
  ArticleDetailListItem,
  ArticleListItem,
} from '@/entities/article/model/types';
import { getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { prependCurrentArchiveItem } from '@/shared/lib/pagination/prepend-current-archive-item';

type GetArticleDetailPageDataInput = {
  articleSlug: string;
  locale: string;
};

type ArticleDetailPageData = {
  archivePage: ArticleArchivePage;
  item: Article | null;
  relatedArticles: ArticleListItem[];
  tagLabels: string[];
};

/**
 * 상세 아티클을 public archive 요약 shape로 좁힙니다.
 */
const toCurrentArticleArchiveItem = (item: Article | null): ArticleDetailListItem | null => {
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
 * 상세 대상 아티클을 좌측 아카이브 목록에 보정합니다.
 */
const ensureCurrentArticleInArchive = (
  item: Article | null,
  archivePage: ArticleArchivePage,
): ArticleArchivePage =>
  prependCurrentArchiveItem<ArticleDetailListItem, ArticleDetailListItem>(
    toCurrentArticleArchiveItem(item),
    archivePage,
  );

/**
 * 상세 아티클 태그를 locale 기준 표시 라벨로 변환합니다.
 */
const getArticleTagLabels = async (item: Article | null, locale: string): Promise<string[]> => {
  const tags = item?.tags ?? [];

  if (tags.length === 0) return [];

  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: tags,
  });

  if (tagLabelMap.schemaMissing) return tags;

  return tags.map(tag => tagLabelMap.data.get(tag) ?? tag);
};

/**
 * 아티클 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getArticleDetailPageData = async ({
  articleSlug,
  locale,
}: GetArticleDetailPageDataInput): Promise<ArticleDetailPageData> => {
  const resolvedArticle = await getResolvedArticle(articleSlug, locale);
  const item = resolvedArticle.item;
  const articleId = item?.id;
  const [archivePage, relatedArticles] = await Promise.all([
    getArticleDetailList({ locale }),
    articleId
      ? getRelatedArticles({
          articleId,
          locale: resolvedArticle.resolvedLocale ?? locale,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const tagLabels = await getArticleTagLabels(item, locale);

  return {
    archivePage: ensureCurrentArticleInArchive(item, archivePage),
    item,
    relatedArticles,
    tagLabels,
  };
};
