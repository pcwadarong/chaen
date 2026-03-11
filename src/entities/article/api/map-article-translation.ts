import type { Article, ArticleDetailListItem, ArticleListItem } from '../model/types';

type ArticleBaseFields = Pick<
  Article,
  | 'allow_comments'
  | 'created_at'
  | 'id'
  | 'publish_at'
  | 'slug'
  | 'thumbnail_url'
  | 'updated_at'
  | 'view_count'
  | 'visibility'
>;

type EmbeddedArticleBaseRow = ArticleBaseFields | ArticleBaseFields[] | null;

type ArticleTranslationFields = Pick<Article, 'content' | 'description' | 'title'> & {
  article_id: string;
};

export type ArticleTranslationRow = ArticleTranslationFields & {
  articles: EmbeddedArticleBaseRow;
};

export type ArticleTranslationFallbackRpcRow = ArticleTranslationFields &
  ArticleBaseFields & {
    locale: string;
  };

/**
 * PostgREST의 to-one embed 결과를 단일 아티클 base row로 정규화합니다.
 *
 * 관계 설정이나 응답 shape에 따라 객체 또는 길이 1 배열로 들어올 수 있어 둘 다 허용합니다.
 *
 * @param embeddedArticle - `article_translations` 응답에 포함된 `articles` 관계 필드
 * @returns 단일 아티클 base row 또는 null
 */
export const getEmbeddedArticleBaseRow = (
  embeddedArticle: EmbeddedArticleBaseRow,
): ArticleBaseFields | null => {
  if (Array.isArray(embeddedArticle)) {
    return embeddedArticle[0] ?? null;
  }

  return embeddedArticle ?? null;
};

/**
 * 번역 + base join 응답 한 행을 화면용 ArticleListItem으로 변환합니다.
 *
 * @param row - `article_translations`와 `articles`를 조인한 응답 행
 * @returns 목록 렌더링에 사용할 아티클 요약 또는 null
 */
export const mapArticleListItem = (row: ArticleTranslationRow): ArticleListItem | null => {
  const articleBase = getEmbeddedArticleBaseRow(row.articles);
  if (!articleBase) return null;

  return {
    created_at: articleBase.created_at,
    description: row.description,
    id: row.article_id,
    thumbnail_url: articleBase.thumbnail_url,
    title: row.title,
  };
};

/**
 * 번역 + base join 응답 여러 행을 화면용 ArticleListItem 배열로 정규화합니다.
 *
 * @param rows - `article_translations` 조인 응답 배열
 * @returns 비어 있지 않은 목록 아이템 배열
 */
export const mapArticleListItems = (rows: ArticleTranslationRow[]): ArticleListItem[] =>
  rows.flatMap(row => {
    const item = mapArticleListItem(row);
    return item ? [item] : [];
  });

/**
 * 번역 + base join 응답 한 행을 상세 좌측 아카이브용 요약 타입으로 변환합니다.
 *
 * @param row - `article_translations`와 `articles`를 조인한 응답 행
 * @returns 상세 아카이브 아이템 또는 null
 */
export const mapArticleDetailListItem = (
  row: ArticleTranslationRow,
): ArticleDetailListItem | null => {
  const articleBase = getEmbeddedArticleBaseRow(row.articles);
  if (!articleBase) return null;

  return {
    created_at: articleBase.created_at,
    description: row.description,
    id: row.article_id,
    title: row.title,
  };
};

/**
 * 번역 + base join 응답 여러 행을 상세 좌측 아카이브 목록으로 변환합니다.
 *
 * @param rows - `article_translations` 조인 응답 배열
 * @returns 상세 아카이브 목록 배열
 */
export const mapArticleDetailListItems = (rows: ArticleTranslationRow[]): ArticleDetailListItem[] =>
  rows.flatMap(row => {
    const item = mapArticleDetailListItem(row);
    return item ? [item] : [];
  });

/**
 * 번역 + base join 응답 한 행을 최종 Article 타입으로 조합합니다.
 *
 * @param row - `article_translations`와 `articles`를 조인한 단일 응답 행
 * @param tags - relation table에서 조회한 tag slug 목록
 * @returns 화면에서 사용할 완성된 아티클 또는 null
 */
export const mapArticle = (row: ArticleTranslationRow, tags: string[]): Article | null => {
  const articleBase = getEmbeddedArticleBaseRow(row.articles);
  if (!articleBase) return null;

  return {
    allow_comments: articleBase.allow_comments,
    content: row.content,
    created_at: articleBase.created_at,
    description: row.description,
    id: row.article_id,
    publish_at: articleBase.publish_at,
    slug: articleBase.slug,
    tags,
    thumbnail_url: articleBase.thumbnail_url,
    title: row.title,
    updated_at: articleBase.updated_at,
    visibility: articleBase.visibility,
    view_count: articleBase.view_count,
  };
};

/**
 * fallback RPC의 평탄한 응답을 기존 mapper 입력 shape로 변환합니다.
 *
 * @param row - `get_article_translation_with_fallback` RPC 반환 행
 * @returns 기존 mapper와 호환되는 translation row
 */
export const mapArticleFallbackRpcRow = (
  row: ArticleTranslationFallbackRpcRow,
): ArticleTranslationRow => ({
  article_id: row.article_id,
  articles: {
    allow_comments: row.allow_comments,
    created_at: row.created_at,
    id: row.id,
    publish_at: row.publish_at,
    slug: row.slug,
    thumbnail_url: row.thumbnail_url,
    updated_at: row.updated_at,
    visibility: row.visibility,
    view_count: row.view_count,
  },
  content: row.content,
  description: row.description,
  title: row.title,
});
