import { getResolvedArticle } from '@/entities/article/api/detail/get-article';
import { getArticleDetailList } from '@/entities/article/api/detail/get-article-detail-list';
import { getRelatedArticles } from '@/entities/article/api/detail/get-related-articles';
import { getArticleComments } from '@/entities/article/comment';
import type { ArticleCommentPage } from '@/entities/article/comment/model';
import type {
  Article,
  ArticleArchivePage,
  ArticleDetailListItem,
  ArticleListItem,
} from '@/entities/article/model/types';
import { prependCurrentArchiveItem } from '@/shared/lib/pagination/prepend-current-archive-item';

type GetArticleDetailPageDataInput = {
  articleSlug: string;
  locale: string;
};

type ArticleDetailPageData = {
  archivePage: ArticleArchivePage;
  initialCommentsPage: ArticleCommentPage;
  item: Article | null;
  relatedArticles: ArticleListItem[];
};

const DEFAULT_COMMENTS_PAGE: ArticleCommentPage = {
  items: [],
  page: 1,
  pageSize: 10,
  sort: 'latest',
  totalCount: 0,
  totalPages: 0,
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
 * 아티클 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getArticleDetailPageData = async ({
  articleSlug,
  locale,
}: GetArticleDetailPageDataInput): Promise<ArticleDetailPageData> => {
  const resolvedArticle = await getResolvedArticle(articleSlug, locale);
  const item = resolvedArticle.item;
  const articleId = item?.id;
  const [archivePage, initialCommentsPage, relatedArticles] = await Promise.all([
    getArticleDetailList({ locale }),
    articleId
      ? getArticleComments({
          articleId,
          page: 1,
          sort: 'latest',
        }).catch(() => DEFAULT_COMMENTS_PAGE)
      : Promise.resolve(DEFAULT_COMMENTS_PAGE),
    articleId
      ? getRelatedArticles({
          articleId,
          locale: resolvedArticle.resolvedLocale ?? locale,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  return {
    archivePage: ensureCurrentArticleInArchive(item, archivePage),
    initialCommentsPage,
    item,
    relatedArticles,
  };
};
