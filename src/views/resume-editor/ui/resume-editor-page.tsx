import React from 'react';

import type {
  ResumeEditorContentMap,
  ResumeEditorState,
  ResumePublishSettings,
} from '@/entities/resume/model/resume-editor.types';
import { ResumeEditorClient } from '@/views/resume-editor/ui/resume-editor-client';
import type { DraftSaveResult } from '@/widgets/editor/model/editor-core.types';

type ResumeEditorPageProps = {
  initialContents: ResumeEditorContentMap;
  initialPublishSettings: ResumePublishSettings;
  initialSavedAt?: string | null;
  onDraftSave?: (state: ResumeEditorState) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (settings: ResumePublishSettings, state: ResumeEditorState) => Promise<void>;
  onUploadPdf?: (file: File) => Promise<ResumePublishSettings>;
};

/**
 * resume 전용 관리자 편집 페이지입니다.
 */
export const ResumeEditorPage = ({
  initialContents,
  initialPublishSettings,
  initialSavedAt,
  onDraftSave,
  onPublishSubmit,
  onUploadPdf,
}: ResumeEditorPageProps) => (
  <ResumeEditorClient
    initialContents={initialContents}
    initialPublishSettings={initialPublishSettings}
    initialSavedAt={initialSavedAt}
    onDraftSave={onDraftSave}
    onPublishSubmit={onPublishSubmit}
    onUploadPdf={onUploadPdf}
  />
);
