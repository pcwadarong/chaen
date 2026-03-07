/**
 * shadow content schema의 테이블/함수 이름을 한 곳에서 관리합니다.
 *
 * cutover 전까지 런타임이 직접 참조하는 이름표라서,
 * rename 시 이 파일만 우선 교체할 수 있게 모아둡니다.
 */
export const CONTENT_SHADOW_SCHEMA = {
  articleSearchRpc: 'search_article_translations',
  articleTags: 'article_tags_v2',
  articleTranslations: 'article_translations',
  articles: 'articles_v2',
  projectTags: 'project_tags_v2',
  projectTranslations: 'project_translations',
  projects: 'projects_v2',
} as const;
