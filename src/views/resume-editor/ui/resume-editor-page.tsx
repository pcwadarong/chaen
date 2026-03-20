import React from 'react';

import type { DraftSaveResult } from '@/entities/editor/model/editor-types';
import type {
  ResumeEditorContentMap,
  ResumeEditorState,
} from '@/entities/resume/model/resume-editor.types';
import { ResumeEditorClient } from '@/views/resume-editor/ui/resume-editor-client';

type ResumeEditorPageProps = {
  hideAppFrameFooter?: boolean;
  initialDraftId?: string | null;
  initialContents: ResumeEditorContentMap;
  initialSavedAt?: string | null;
  onDraftSave?: (
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (state: ResumeEditorState, draftId?: string | null) => Promise<void>;
};

/**
 * resume 전용 관리자 편집 페이지입니다.
 */
export const ResumeEditorPage = ({
  hideAppFrameFooter = false,
  initialDraftId,
  initialContents,
  initialSavedAt,
  onDraftSave,
  onPublishSubmit,
}: ResumeEditorPageProps) => (
  <ResumeEditorClient
    hideAppFrameFooter={hideAppFrameFooter}
    initialDraftId={initialDraftId}
    initialContents={initialContents}
    initialSavedAt={initialSavedAt}
    onDraftSave={onDraftSave}
    onPublishSubmit={onPublishSubmit}
  />
);
