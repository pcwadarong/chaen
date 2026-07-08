import type { ArticleCommentsSort } from '@/entities/article/comment/model';
import type { PdfFileDownloadSource, PdfFileKind } from '@/entities/pdf-file/model/types';
import type { AppLocale } from '@/i18n/routing';

/**
 * `articles.feed` 쿼리 키에 넣기 전 검색어를 정규화합니다.
 *
 * `src/entities/article/api/list/get-articles.ts`의 `normalizeSearchQuery`와
 * 동일한 기준(앞뒤 공백 제거, 빈 값은 `''`)을 따릅니다. 정규화 기준이
 * 어긋나면 동일한 조회 조건인데도 캐시 키가 갈라져 불필요한 재조회가
 * 발생하므로 두 곳의 기준을 반드시 맞춰야 합니다.
 *
 * @param query 원본 검색어입니다.
 * @returns 정규화된 검색어입니다.
 */
const normalizeSearchQuery = (query?: string | null) => query?.trim() ?? '';

/**
 * `articles.feed` 쿼리 키에 넣기 전 태그를 정규화합니다.
 *
 * `src/entities/article/api/list/get-articles.ts`의 `normalizeArticleTag`와
 * 동일한 기준(앞뒤 공백 제거 후 소문자화, 빈 값은 `''`)을 따릅니다.
 *
 * @param tag 원본 태그입니다.
 * @returns 정규화된 태그입니다.
 */
const normalizeArticleTag = (tag?: string | null) => (tag?.trim() ? tag.trim().toLowerCase() : '');

/**
 * `detailArchive.feed` 쿼리 키에서 아카이브 도메인을 구분하는 값입니다.
 * 현재 `DetailArchiveFeed`가 사용되는 두 화면(글 상세/프로젝트 상세)에 대응합니다.
 */
export type DetailArchiveDomain = 'article' | 'project';

/**
 * `editor.slugCheck` 쿼리 키에서 콘텐츠 종류를 구분하는 값입니다.
 * 이력서(`resume`)는 slug 중복 검사 대상이 아니므로 포함하지 않습니다.
 */
export type EditorSlugCheckType = 'article' | 'project';

/**
 * 글(article) 목록 관련 React Query 키 팩토리입니다.
 */
export const articles = {
  /**
   * 이 네임스페이스의 모든 쿼리 키가 공유하는 최상위 접두사입니다.
   */
  all: ['articles'] as const,
  /**
   * locale/검색어/태그 조합에 대한 글 피드(무한 스크롤) 쿼리 키를 만듭니다.
   *
   * 검색어와 태그는 `get-articles.ts`와 동일한 기준으로 정규화한 뒤 키에
   * 넣어, 표기만 다른 동일 조건(예: 공백·대소문자 차이)이 서로 다른 캐시
   * 엔트리로 분리되지 않게 합니다. 또한 `get-articles.ts`가 검색어가 있으면
   * 태그 필터를 무시하는 것과 동일하게, 검색어가 있을 때는 태그를 빈 값으로
   * 취급해 실제로 동일한 데이터를 반환하는 조합이 같은 키를 갖도록 합니다.
   *
   * @param params locale, 검색어(`q`), 태그(`tag`)입니다.
   * @returns 글 피드 쿼리 키입니다.
   */
  feed: (params: { locale: AppLocale; q?: string | null; tag?: string | null }) => {
    const normalizedQuery = normalizeSearchQuery(params.q);
    const normalizedTag = normalizedQuery ? '' : normalizeArticleTag(params.tag);

    return [
      ...articles.all,
      'feed',
      {
        locale: params.locale,
        q: normalizedQuery,
        tag: normalizedTag,
      },
    ] as const;
  },
  /**
   * locale별 인기 태그 목록 쿼리 키를 만듭니다.
   *
   * @param locale 대상 locale입니다.
   * @returns 인기 태그 쿼리 키입니다.
   */
  popularTags: (locale: AppLocale) => [...articles.all, 'popularTags', locale] as const,
};

/**
 * 글 댓글(article comments) 관련 React Query 키 팩토리입니다.
 */
export const articleComments = {
  /**
   * 이 네임스페이스의 모든 쿼리 키가 공유하는 최상위 접두사입니다.
   */
  all: ['articleComments'] as const,
  /**
   * 특정 글의 댓글 전체(모든 정렬·페이지)를 아우르는 범위 키를 만듭니다.
   *
   * 개별 페이지 키(`page`)가 모두 이 키를 접두사로 포함하므로,
   * 댓글 작성/수정/삭제 후 `invalidateQueries({ queryKey: articleComments.scope(articleId) })`로
   * 해당 글의 모든 댓글 페이지를 한 번에 stale 처리할 수 있습니다.
   *
   * @param articleId 대상 글 id입니다.
   * @returns 댓글 범위 쿼리 키입니다.
   */
  scope: (articleId: string) => [...articleComments.all, articleId] as const,
  /**
   * 특정 글·정렬·페이지의 댓글 목록 쿼리 키를 만듭니다.
   *
   * @param articleId 대상 글 id입니다.
   * @param sort 댓글 정렬 기준입니다.
   * @param page 조회할 페이지 번호입니다.
   * @returns 댓글 페이지 쿼리 키입니다.
   */
  page: (articleId: string, sort: ArticleCommentsSort, page: number) =>
    [...articleComments.scope(articleId), sort, page] as const,
};

/**
 * 프로젝트(project) 목록 관련 React Query 키 팩토리입니다.
 */
export const projects = {
  /**
   * 이 네임스페이스의 모든 쿼리 키가 공유하는 최상위 접두사입니다.
   */
  all: ['projects'] as const,
  /**
   * locale별 프로젝트 피드(무한 스크롤) 쿼리 키를 만듭니다.
   *
   * @param locale 대상 locale입니다.
   * @returns 프로젝트 피드 쿼리 키입니다.
   */
  feed: (locale: AppLocale) => [...projects.all, 'feed', locale] as const,
  /**
   * locale별 프로젝트 미리보기(히어로 등) 쿼리 키를 만듭니다.
   *
   * @param locale 대상 locale입니다.
   * @param limit 조회할 개수입니다.
   * @returns 프로젝트 미리보기 쿼리 키입니다.
   */
  preview: (locale: AppLocale, limit: number) =>
    [...projects.all, 'preview', locale, limit] as const,
};

/**
 * 태그(tag) 관련 React Query 키 팩토리입니다.
 */
export const tags = {
  /**
   * locale별 전체 태그 목록 쿼리 키를 만듭니다.
   *
   * @param locale 대상 locale입니다.
   * @returns 전체 태그 쿼리 키입니다.
   */
  all: (locale: AppLocale) => ['tags', 'all', locale] as const,
};

/**
 * PDF 다운로드 옵션/가용성 관련 React Query 키 팩토리입니다.
 */
export const pdf = {
  /**
   * 이 네임스페이스의 모든 쿼리 키가 공유하는 최상위 접두사입니다.
   * PDF 업로드 성공 시 이 접두사로 `invalidateQueries`하면 옵션/가용성 쿼리를
   * 한 번에 무효화할 수 있습니다.
   */
  all: ['pdf'] as const,
  /**
   * 어드민 PDF 가용성 조회 쿼리 키입니다. 파라미터가 없어 상수로 둡니다.
   */
  adminAvailability: ['pdf', 'adminAvailability'] as const,
  /**
   * 콘텐츠 종류·화면 위치별 PDF 다운로드 옵션 쿼리 키를 만듭니다.
   *
   * @param kind PDF 콘텐츠 종류입니다.
   * @param source 다운로드가 발생한 화면 위치입니다.
   * @returns PDF 옵션 쿼리 키입니다.
   */
  options: (kind: PdfFileKind, source: PdfFileDownloadSource) =>
    [...pdf.all, 'options', kind, source] as const,
};

/**
 * 상세 페이지 아카이브(인접 글/프로젝트 목록) 관련 React Query 키 팩토리입니다.
 */
export const detailArchive = {
  /**
   * 이 네임스페이스의 모든 쿼리 키가 공유하는 최상위 접두사입니다.
   */
  all: ['detailArchive'] as const,
  /**
   * 도메인·locale·시드 커서별 아카이브 피드(무한 스크롤) 쿼리 키를 만듭니다.
   *
   * @param domain 아카이브 대상 도메인(글/프로젝트)입니다.
   * @param locale 대상 locale입니다.
   * @param seedKey 서버 부트스트랩이 넘겨준 시드 커서입니다. 루트 페이지는 `null`입니다.
   * @returns 아카이브 피드 쿼리 키입니다.
   */
  feed: (domain: DetailArchiveDomain, locale: AppLocale, seedKey: string | null) =>
    [...detailArchive.all, 'feed', domain, locale, seedKey] as const,
};

/**
 * OG(오픈그래프) 미리보기 관련 React Query 키 팩토리입니다.
 */
export const og = {
  /**
   * 이 네임스페이스의 모든 쿼리 키가 공유하는 최상위 접두사입니다.
   */
  all: ['og'] as const,
  /**
   * URL별 OG 미리보기 메타데이터 쿼리 키를 만듭니다.
   *
   * @param url 미리보기를 조회할 URL입니다.
   * @returns OG 미리보기 쿼리 키입니다.
   */
  preview: (url: string) => [...og.all, 'preview', url] as const,
};

/**
 * 에디터(글/프로젝트 작성) 관련 React Query 키 팩토리입니다.
 */
export const editor = {
  /**
   * 이 네임스페이스의 모든 쿼리 키가 공유하는 최상위 접두사입니다.
   */
  all: ['editor'] as const,
  /**
   * 콘텐츠 종류·slug·제외 id별 slug 중복 확인 쿼리 키를 만듭니다.
   *
   * @param type 콘텐츠 종류(글/프로젝트)입니다.
   * @param slug 확인할 slug입니다.
   * @param excludeId 수정 중인 콘텐츠 자신의 id입니다. 신규 작성 시 `null`/`undefined`입니다.
   * @returns slug 중복 확인 쿼리 키입니다.
   */
  slugCheck: (type: EditorSlugCheckType, slug: string, excludeId?: string | null) =>
    [...editor.all, 'slugCheck', type, slug, excludeId ?? null] as const,
};
