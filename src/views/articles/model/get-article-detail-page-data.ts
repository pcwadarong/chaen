import { getResolvedArticle } from '@/entities/article/api/get-article';
import { getArticleDetailList } from '@/entities/article/api/get-article-detail-list';
import { getRelatedArticles } from '@/entities/article/api/get-related-articles';
import type {
  Article,
  ArticleArchivePage,
  ArticleDetailListItem,
  ArticleListItem,
} from '@/entities/article/model/types';
import { getArticleComments } from '@/entities/article-comment';
import type { ArticleCommentPage } from '@/entities/article-comment/model/types';
import { prependCurrentArchiveItem } from '@/shared/lib/pagination/prepend-current-archive-item';

type GetArticleDetailPageDataInput = {
  articleId: string;
  locale: string;
};

type ArticleDetailPageData = {
  archivePage: ArticleArchivePage;
  initialCommentsPage: ArticleCommentPage;
  item: Article | null;
  relatedArticles: ArticleListItem[];
};

/**
 * 상세 대상 아티클을 좌측 아카이브 목록에 보정합니다.
 */
const ensureCurrentArticleInArchive = (
  item: Article | null,
  archivePage: ArticleArchivePage,
): ArticleArchivePage =>
  prependCurrentArchiveItem<ArticleDetailListItem, Article>(item, archivePage);

/**
 * 아티클 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getArticleDetailPageData = async ({
  articleId,
  locale,
}: GetArticleDetailPageDataInput): Promise<ArticleDetailPageData> => {
  const resolvedArticle = await getResolvedArticle(articleId, locale);
  const item = resolvedArticle.item;
  const [archivePage, initialCommentsPage, relatedArticles] = await Promise.all([
    getArticleDetailList({ locale }),
    getArticleComments({
      articleId,
      page: 1,
      sort: 'latest',
    }).catch(() => ({
      items: [],
      page: 1,
      pageSize: 10,
      sort: 'latest' as const,
      totalCount: 0,
      totalPages: 0,
    })),
    item
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
