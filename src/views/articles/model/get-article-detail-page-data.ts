import { getArticle } from '@/entities/article/api/get-article';
import { getArticleDetailList } from '@/entities/article/api/get-article-detail-list';
import type {
  Article,
  ArticleArchivePage,
  ArticleDetailListItem,
} from '@/entities/article/model/types';
import { getArticleComments } from '@/entities/article-comment';
import type { ArticleCommentPage } from '@/entities/article-comment/model/types';

type GetArticleDetailPageDataInput = {
  articleId: string;
  locale: string;
};

type ArticleDetailPageData = {
  archivePage: ArticleArchivePage;
  initialCommentsPage: ArticleCommentPage;
  item: Article | null;
};

/**
 * 상세 대상 아티클을 좌측 아카이브 목록에 보정합니다.
 */
const ensureCurrentArticleInArchive = (
  item: Article | null,
  archivePage: ArticleArchivePage,
): ArticleArchivePage => {
  if (!item) return archivePage;
  if (archivePage.items.some(archiveItem => archiveItem.id === item.id)) return archivePage;
  const remainingItemCount = Math.max(archivePage.items.length - 1, 0);

  const nextItems: ArticleDetailListItem[] = [
    {
      created_at: item.created_at,
      description: item.description,
      id: item.id,
      title: item.title,
    },
    ...archivePage.items.slice(0, remainingItemCount),
  ];

  return {
    ...archivePage,
    items: nextItems,
  };
};

/**
 * 아티클 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getArticleDetailPageData = async ({
  articleId,
  locale,
}: GetArticleDetailPageDataInput): Promise<ArticleDetailPageData> => {
  const [item, archivePage, initialCommentsPage] = await Promise.all([
    getArticle(articleId, locale),
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
  ]);

  return {
    archivePage: ensureCurrentArticleInArchive(item, archivePage),
    initialCommentsPage,
    item,
  };
};
