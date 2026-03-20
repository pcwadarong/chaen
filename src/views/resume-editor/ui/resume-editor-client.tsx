'use client';

import React, { useCallback, useState } from 'react';

import type { DraftSaveResult } from '@/entities/editor/model/editor-types';
import type { ResumeEditorState } from '@/entities/resume/model/resume-editor.types';
import { ResumeEditorCore } from '@/widgets/resume-editor';

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

const MemoizedResumeEditorCore = React.memo(ResumeEditorCore);

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
    async (state: ResumeEditorState) => {
      if (!onDraftSave) {
        return undefined;
      }

      const result = await onDraftSave(state, draftId);

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
    async (state: ResumeEditorState) => {
      if (!onPublishSubmit) {
        return;
      }

      await onPublishSubmit(state, draftId);
    },
    [draftId, onPublishSubmit],
  );

  return (
    <MemoizedResumeEditorCore
      hideAppFrameFooter={hideAppFrameFooter}
      initialContents={initialContents}
      initialSavedAt={initialSavedAt}
      onDraftSave={handleDraftSave}
      onPublish={onPublishSubmit ? handlePublish : undefined}
    />
  );
};
