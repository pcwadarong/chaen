import type {
  DraftSaveResult,
  EditorState,
  PublishActionResult,
} from '@/entities/editor/model/editor-types';
import type { ResumeEditorState } from '@/entities/resume/model/resume-editor.types';
import { editorStateToResumeEditorState } from '@/entities/resume/model/resume-editor.utils';

type ResumeDraftSaveActionParams = {
  draftId: string | null;
  onDraftSave: (
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<DraftSaveResult | void>;
  state: EditorState;
};

type ResumePublishActionParams = {
  draftId: string | null;
  onPublishSubmit: (
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<PublishActionResult | void>;
  state: EditorState;
};

type ResumeDraftSaveActionResult = {
  nextDraftId: string | null;
  result: DraftSaveResult | void;
};

type ResumePublishActionResult = {
  redirectPath: string | null;
  result: PublishActionResult | void;
};

export type ResumePublishNavigationMode = 'push' | 'replace-refresh';

/**
 * 공용 editor 상태를 resume draft 저장 액션 입력으로 변환하고 다음 draftId를 계산합니다.
 *
 * @param draftId 현재 이어쓰기 대상 draft 식별자입니다.
 * @param onDraftSave resume draft 저장 서버 액션입니다.
 * @param state 공용 editor 셸이 만든 현재 편집 상태입니다.
 * @returns 저장 결과와 다음 요청에서 사용할 draftId를 함께 반환합니다.
 */
export const submitResumeDraft = async ({
  draftId,
  onDraftSave,
  state,
}: ResumeDraftSaveActionParams): Promise<ResumeDraftSaveActionResult> => {
  const result = await onDraftSave(editorStateToResumeEditorState(state), draftId);

  return {
    nextDraftId: result?.draftId ?? draftId,
    result,
  };
};

/**
 * 공용 editor 상태를 resume 발행 액션 입력으로 변환하고 redirect 경로를 추출합니다.
 *
 * @param draftId 현재 이어쓰기 대상 draft 식별자입니다.
 * @param onPublishSubmit resume 발행 서버 액션입니다.
 * @param state 공용 editor 셸이 만든 현재 편집 상태입니다.
 * @returns 발행 결과와 성공 시 이동해야 할 경로를 함께 반환합니다.
 */
export const submitResumePublish = async ({
  draftId,
  onPublishSubmit,
  state,
}: ResumePublishActionParams): Promise<ResumePublishActionResult> => {
  const result = await onPublishSubmit(editorStateToResumeEditorState(state), draftId);

  return {
    redirectPath: result?.redirectPath ?? null,
    result,
  };
};

/**
 * resume 발행 완료 후 어떤 클라이언트 내비게이션을 써야 하는지 계산합니다.
 *
 * resume는 발행 성공 후 현재 편집 화면(`/admin/resume/edit`)으로 다시 돌아오는 경우가 많습니다.
 * 이때 `router.push()`만 호출하면 같은 경로 이동이 no-op처럼 보일 수 있으므로
 * 현재 경로와 동일하면 `replace + refresh` 조합을 사용합니다.
 *
 * @param currentPathname 현재 브라우저 pathname입니다.
 * @param redirectPath 서버 액션이 반환한 이동 경로입니다.
 * @returns redirectPath가 현재 경로와 같으면 `replace-refresh`, 아니면 `push`
 */
export const resolveResumePublishNavigationMode = ({
  currentPathname,
  redirectPath,
}: {
  currentPathname: string;
  redirectPath: string;
}): ResumePublishNavigationMode => {
  const normalizedCurrentPathname = currentPathname.split('?')[0] ?? currentPathname;
  const normalizedRedirectPath = redirectPath.split('?')[0] ?? redirectPath;

  return normalizedCurrentPathname === normalizedRedirectPath ? 'replace-refresh' : 'push';
};
