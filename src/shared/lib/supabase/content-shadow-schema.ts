/**
 * content schema의 shadow/canonical 이름을 한 곳에서 관리합니다.
 *
 * cutover 전에는 `active`가 shadow 이름을 가리키고,
 * rename 직후에는 `active`만 canonical로 바꾸면 되게 구성합니다.
 */
export const CONTENT_SCHEMA_NAMES = {
  canonical: {
    articleSearchRpc: 'search_article_translations',
    articleTags: 'article_tags',
    articleTranslations: 'article_translations',
    articles: 'articles',
    projectTags: 'project_tags',
    projectTranslations: 'project_translations',
    projects: 'projects',
  },
  shadow: {
    articleSearchRpc: 'search_article_translations',
    articleTags: 'article_tags_v2',
    articleTranslations: 'article_translations',
    articles: 'articles_v2',
    projectTags: 'project_tags_v2',
    projectTranslations: 'project_translations',
    projects: 'projects_v2',
  },
} as const;

/**
 * 현재 런타임이 참조하는 content schema 이름입니다.
 *
 * maintenance window에서 cutover SQL을 실행한 직후,
 * 아래 타깃 값만 `canonical`로 바꾸는 것을 기준으로 삼습니다.
 */
export const CONTENT_SCHEMA_TARGET = 'canonical' as const;

export const CONTENT_SHADOW_SCHEMA = CONTENT_SCHEMA_NAMES[CONTENT_SCHEMA_TARGET];
