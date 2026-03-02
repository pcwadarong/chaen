/**
 * 프로젝트 목록 캐시 무효화에 사용하는 공통 태그입니다.
 */
export const PROJECTS_CACHE_TAG = 'projects';

/**
 * 프로젝트 상세 캐시 무효화용 태그를 생성합니다.
 */
export const createProjectCacheTag = (projectId: string) => `project:${projectId}`;
