import type { AdminArticleListItem } from '@/entities/article/model/types';
import type { AdminProjectListItem } from '@/entities/project/model/types';

/**
 * 관리자 콘텐츠 화면에서 활성화할 탭 종류입니다.
 *
 * - `articles`: 아티클 리스트 관리 탭
 * - `projects`: 프로젝트 리스트 및 순서 관리 탭
 */
export type ContentTab = 'articles' | 'projects';

/**
 * 관리자 콘텐츠 화면에서 사용하는 공개 상태 값입니다.
 *
 * - `public`: 공개 상태
 * - `private`: 비공개 상태
 */
export type VisibilityValue = 'private' | 'public';

/**
 * 관리자 콘텐츠 페이지가 필요로 하는 서버 데이터와 액션 계약입니다.
 *
 * `articles`와 `projects`는 각각 관리자 리스트에 바로 렌더링할 요약 항목 배열입니다.
 * `signOutRedirectPath`는 관리자 로그아웃 후 이동할 경로 문자열입니다.
 * `onSaveProjectOrder`는 정렬된 프로젝트 id 배열(`orderedProjectIds: string[]`)을 받아
 * 서버에 저장하고 `Promise<void>`를 반환해야 합니다.
 * `onToggleArticleVisibility`는 `{ articleId, articleSlug, visibility }` 형태 입력을 받아
 * 아티클 공개 상태를 변경하고 `Promise<void>`를 반환해야 합니다.
 * `onToggleProjectVisibility`는 `{ projectId, projectSlug, visibility }` 형태 입력을 받아
 * 프로젝트 공개 상태를 변경하고 `Promise<void>`를 반환해야 합니다.
 */
export type AdminContentPageProps = {
  articles: AdminArticleListItem[];
  signOutRedirectPath?: string;
  onSaveProjectOrder?: (orderedProjectIds: string[]) => Promise<void>;
  onToggleArticleVisibility?: (input: {
    articleId: string;
    articleSlug?: string;
    visibility: VisibilityValue;
  }) => Promise<void>;
  onToggleProjectVisibility?: (input: {
    projectId: string;
    projectSlug?: string;
    visibility: VisibilityValue;
  }) => Promise<void>;
  projects: AdminProjectListItem[];
};
