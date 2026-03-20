'use client';

import React, { useCallback, useState } from 'react';

import type { DraftSaveResult, EditorState } from '@/entities/editor/model/editor-types';
import type { ResumeEditorState } from '@/entities/resume/model/resume-editor.types';
import {
  editorStateToResumeEditorState,
  resumeContentMapToEditorTranslations,
} from '@/entities/resume/model/resume-editor.utils';
import { parseResumeEditorError } from '@/entities/resume/model/resume-editor-error';
import { EditorCore } from '@/widgets/editor';

type ResumeEditorClientProps = {
  hideAppFrameFooter?: boolean;
  initialDraftId?: string | null;
  initialContents: ResumeEditorState['contents'];
  initialSavedAt?: string | null;
  onDraftSave?: (
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (state: ResumeEditorState, draftId?: string | null) => Promise<void>;
};

const MemoizedEditorCore = React.memo(EditorCore);

/**
 * resume 전용 관리자 화면에서 편집 셸과 서버 액션을 연결합니다.
 */
export const ResumeEditorClient = ({
  hideAppFrameFooter = false,
  initialDraftId = null,
  initialContents,
  initialSavedAt = null,
  onDraftSave,
  onPublishSubmit,
}: ResumeEditorClientProps) => {
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);

  const handleDraftSave = useCallback(
    async (state: EditorState) => {
      if (!onDraftSave) {
        return undefined;
      }

      const result = await onDraftSave(editorStateToResumeEditorState(state), draftId);

      if (result?.draftId) {
        setDraftId(result.draftId);
      }

      return result;
    },
    [draftId, onDraftSave],
  );

  /**
   * 편집 셸 하단 발행 버튼을 서버 발행 흐름에 연결합니다.
   */
  const handlePublish = useCallback(
    async (state: EditorState) => {
      if (!onPublishSubmit) {
        return;
      }

      await onPublishSubmit(editorStateToResumeEditorState(state), draftId);
    },
    [draftId, onPublishSubmit],
  );

  return (
    <MemoizedEditorCore
      availableTags={[]}
      contentType="resume"
      enableAutosave={false}
      extraLocaleFieldLabel="다운로드 버튼 라벨"
      hideAppFrameFooter={hideAppFrameFooter}
      hideTagSelector
      initialSlug=""
      initialTags={[]}
      initialSavedAt={initialSavedAt}
      initialTranslations={resumeContentMapToEditorTranslations(initialContents)}
      onDraftSave={handleDraftSave}
      onDirectPublish={onPublishSubmit ? handlePublish : undefined}
      onDirectPublishError={error => parseResumeEditorError(error, 'publishFailed').message}
      publishButtonLabel="발행하기"
      publishPendingLabel="발행 중..."
    />
  );
};
