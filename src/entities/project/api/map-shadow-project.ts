import type { Project, ProjectDetailListItem, ProjectListItem } from '../model/types';

type ProjectBaseFields = Pick<
  Project,
  'created_at' | 'id' | 'period_end' | 'period_start' | 'thumbnail_url'
>;

type EmbeddedProjectBaseRow = ProjectBaseFields | ProjectBaseFields[] | null;

type ProjectTranslationFields = Pick<Project, 'content' | 'description' | 'title'> & {
  project_id: string;
};

export type ShadowProjectTranslationRow = ProjectTranslationFields & {
  projects: EmbeddedProjectBaseRow;
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
export const mapShadowProjectListItem = (
  row: ShadowProjectTranslationRow,
): ProjectListItem | null => {
  const projectBase = getEmbeddedProjectBaseRow(row.projects);
  if (!projectBase) return null;

  return {
    created_at: projectBase.created_at,
    description: row.description,
    id: row.project_id,
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
export const mapShadowProjectListItems = (rows: ShadowProjectTranslationRow[]): ProjectListItem[] =>
  rows.flatMap(row => {
    const item = mapShadowProjectListItem(row);
    return item ? [item] : [];
  });

/**
 * 번역 + base join 응답 한 행을 상세 좌측 아카이브용 요약 타입으로 변환합니다.
 *
 * @param row - `project_translations`와 `projects`를 조인한 응답 행
 * @returns 상세 아카이브 아이템 또는 null
 */
export const mapShadowProjectDetailListItem = (
  row: ShadowProjectTranslationRow,
): ProjectDetailListItem | null => {
  const projectBase = getEmbeddedProjectBaseRow(row.projects);
  if (!projectBase) return null;

  return {
    created_at: projectBase.created_at,
    description: row.description,
    id: row.project_id,
    title: row.title,
  };
};

/**
 * 번역 + base join 응답 여러 행을 상세 좌측 아카이브 목록으로 변환합니다.
 *
 * @param rows - `project_translations` 조인 응답 배열
 * @returns 상세 아카이브 목록 배열
 */
export const mapShadowProjectDetailListItems = (
  rows: ShadowProjectTranslationRow[],
): ProjectDetailListItem[] =>
  rows.flatMap(row => {
    const item = mapShadowProjectDetailListItem(row);
    return item ? [item] : [];
  });

/**
 * 번역 + base join 응답 한 행을 최종 Project 타입으로 조합합니다.
 *
 * @param row - `project_translations`와 `projects`를 조인한 단일 응답 행
 * @param tags - relation table에서 조회한 canonical tag slug 목록
 * @returns 화면에서 사용할 완성된 프로젝트 또는 null
 */
export const mapShadowProject = (
  row: ShadowProjectTranslationRow,
  tags: string[],
): Project | null => {
  const projectBase = getEmbeddedProjectBaseRow(row.projects);
  if (!projectBase) return null;

  return {
    content: row.content,
    created_at: projectBase.created_at,
    description: row.description,
    id: row.project_id,
    period_end: projectBase.period_end,
    period_start: projectBase.period_start,
    tags,
    thumbnail_url: projectBase.thumbnail_url,
    title: row.title,
  };
};
