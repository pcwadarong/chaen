import { getArticle } from '@/entities/article/api/get-article';
import { getArticleDetailList } from '@/entities/article/api/get-article-detail-list';
import type { Article, ArticleDetailListItem } from '@/entities/article/model/types';

type GetArticleDetailPageDataInput = {
  articleId: string;
  locale: string;
};

type ArticleDetailPageData = {
  archiveItems: ArticleDetailListItem[];
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
  const [item, archiveItems] = await Promise.all([
    getArticle(articleId, locale),
    getArticleDetailList(locale).catch(() => []),
  ]);

  return {
    archiveItems: ensureCurrentArticleInArchive(item, archiveItems),
    item,
  };
};
