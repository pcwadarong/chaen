import type {
  Project,
  ProjectDetailListItem,
  ProjectListItem,
} from '@/entities/project/model/types';

type ProjectBaseFields = Pick<
  Project,
  | 'created_at'
  | 'display_order'
  | 'github_url'
  | 'id'
  | 'period_end'
  | 'period_start'
  | 'publish_at'
  | 'slug'
  | 'thumbnail_url'
  | 'visibility'
  | 'website_url'
>;

type EmbeddedProjectBaseRow = ProjectBaseFields | ProjectBaseFields[] | null;

type ProjectTranslationFields = Pick<Project, 'content' | 'description' | 'title'> & {
  locale: string;
  project_id: string;
};

export type ProjectTranslationRow = ProjectTranslationFields & {
  projects: EmbeddedProjectBaseRow;
};

export type ProjectTranslationFallbackRpcRow = ProjectTranslationFields &
  ProjectBaseFields & {
    locale: string;
  };

/**
 * PostgREST의 to-one embed 결과를 단일 프로젝트 base row로 정규화합니다.
 *
 * @param embeddedProject - `project_translations` 응답에 포함된 `projects` 관계 필드
 * @returns 단일 프로젝트 base row 또는 null
 */
export const getEmbeddedProjectBaseRow = (
  embeddedProject: EmbeddedProjectBaseRow,
): ProjectBaseFields | null => {
  if (Array.isArray(embeddedProject)) {
    return embeddedProject[0] ?? null;
  }

  return embeddedProject ?? null;
};

/**
 * 번역 + base join 응답 한 행을 화면용 ProjectListItem으로 변환합니다.
 *
 * @param row - `project_translations`와 `projects`를 조인한 응답 행
 * @returns 목록 렌더링에 사용할 프로젝트 요약 또는 null
 */
export const mapProjectListItem = (row: ProjectTranslationRow): ProjectListItem | null => {
  const projectBase = getEmbeddedProjectBaseRow(row.projects);
  if (!projectBase) return null;
  if (!projectBase.publish_at || !projectBase.slug) return null;

  return {
    description: row.description,
    id: row.project_id,
    period_end: null,
    period_start: null,
    publish_at: projectBase.publish_at,
    slug: projectBase.slug,
    tech_stacks: [],
    thumbnail_url: projectBase.thumbnail_url,
    title: row.title,
  };
};

/**
 * 번역 + base join 응답 여러 행을 화면용 ProjectListItem 배열로 정규화합니다.
 *
 * @param rows - `project_translations` 조인 응답 배열
 * @returns 비어 있지 않은 목록 아이템 배열
 */
export const mapProjectListItems = (rows: ProjectTranslationRow[]): ProjectListItem[] =>
  rows.flatMap(row => {
    const item = mapProjectListItem(row);
    return item ? [item] : [];
  });

/**
 * 번역 + base join 응답 한 행을 상세 좌측 아카이브용 요약 타입으로 변환합니다.
 *
 * @param row - `project_translations`와 `projects`를 조인한 응답 행
 * @returns 상세 아카이브 아이템 또는 null
 */
export const mapProjectDetailListItem = (
  row: ProjectTranslationRow,
): ProjectDetailListItem | null => {
  const projectBase = getEmbeddedProjectBaseRow(row.projects);
  if (!projectBase) return null;
  if (!projectBase.publish_at || !projectBase.slug) return null;

  return {
    description: row.description,
    id: row.project_id,
    publish_at: projectBase.publish_at,
    slug: projectBase.slug,
    title: row.title,
  };
};

/**
 * 번역 + base join 응답 여러 행을 상세 좌측 아카이브 목록으로 변환합니다.
 *
 * @param rows - `project_translations` 조인 응답 배열
 * @returns 상세 아카이브 목록 배열
 */
export const mapProjectDetailListItems = (rows: ProjectTranslationRow[]): ProjectDetailListItem[] =>
  rows.flatMap(row => {
    const item = mapProjectDetailListItem(row);
    return item ? [item] : [];
  });

/**
 * 번역 + base join 응답 한 행을 최종 Project 타입으로 조합합니다.
 *
 * @param row - `project_translations`와 `projects`를 조인한 단일 응답 행
 * @param techStacks - relation table에서 조회한 기술 스택 목록
 * @returns 화면에서 사용할 완성된 프로젝트 또는 null
 */
export const mapProject = (
  row: ProjectTranslationRow,
  techStacks: Project['tech_stacks'],
): Project | null => {
  const projectBase = getEmbeddedProjectBaseRow(row.projects);
  if (!projectBase) return null;
  if (!projectBase.publish_at || !projectBase.slug) return null;

  return {
    content: row.content,
    created_at: projectBase.created_at,
    description: row.description,
    display_order: projectBase.display_order,
    github_url: projectBase.github_url,
    id: row.project_id,
    period_end: projectBase.period_end,
    period_start: projectBase.period_start,
    publish_at: projectBase.publish_at,
    slug: projectBase.slug,
    tags: (techStacks ?? []).map(techStack => techStack.name),
    tech_stacks: techStacks,
    thumbnail_url: projectBase.thumbnail_url,
    title: row.title,
    visibility: projectBase.visibility,
    website_url: projectBase.website_url,
  };
};

/**
 * fallback RPC의 평탄한 응답을 기존 mapper 입력 shape로 변환합니다.
 *
 * @param row - `get_project_translation_with_fallback` RPC 반환 행
 * @returns 기존 mapper와 호환되는 translation row
 */
export const mapProjectFallbackRpcRow = (
  row: ProjectTranslationFallbackRpcRow,
): ProjectTranslationRow => ({
  content: row.content,
  description: row.description,
  locale: row.locale,
  project_id: row.project_id,
  projects: {
    created_at: row.created_at,
    display_order: row.display_order,
    github_url: row.github_url,
    id: row.id,
    period_end: row.period_end,
    period_start: row.period_start,
    publish_at: row.publish_at,
    slug: row.slug,
    thumbnail_url: row.thumbnail_url,
    visibility: row.visibility,
    website_url: row.website_url,
  },
  title: row.title,
});
