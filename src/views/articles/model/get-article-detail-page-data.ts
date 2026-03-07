import { getArticle } from '@/entities/article/api/get-article';
import { getArticleDetailList } from '@/entities/article/api/get-article-detail-list';
import type { Article, ArticleDetailListItem } from '@/entities/article/model/types';
import { getArticleComments } from '@/entities/article-comment';
import type { ArticleCommentPage } from '@/entities/article-comment/model/types';

type GetArticleDetailPageDataInput = {
  articleId: string;
  locale: string;
};

type ArticleDetailPageData = {
  archiveItems: ArticleDetailListItem[];
  initialCommentsPage: ArticleCommentPage;
  item: Article | null;
};

/**
 * 상세 대상 아티클을 좌측 아카이브 목록에 보정합니다.
 */
const ensureCurrentArticleInArchive = (
  item: Article | null,
  archiveItems: ArticleDetailListItem[],
): ArticleDetailListItem[] => {
  if (!item) return archiveItems;
  if (archiveItems.some(archiveItem => archiveItem.id === item.id)) return archiveItems;

  return [
    {
      created_at: item.created_at,
      description: item.description,
      id: item.id,
      title: item.title,
    },
    ...archiveItems.slice(0, 199),
  ];
};

/**
 * 아티클 상세 페이지에 필요한 데이터 묶음을 조회합니다.
 */
export const getArticleDetailPageData = async ({
  articleId,
  locale,
}: GetArticleDetailPageDataInput): Promise<ArticleDetailPageData> => {
  const [item, archiveItems, initialCommentsPage] = await Promise.all([
    getArticle(articleId, locale),
    getArticleDetailList(locale).catch(() => []),
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
    archiveItems: ensureCurrentArticleInArchive(item, archiveItems),
    initialCommentsPage,
    item,
  };
};
