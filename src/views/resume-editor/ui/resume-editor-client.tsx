'use client';

import React, { useState } from 'react';

import { uploadPdfFileByKind } from '@/entities/pdf-file/api/upload-pdf-file-by-kind';
import type {
  ResumeEditorState,
  ResumePublishSettings,
} from '@/entities/resume/model/resume-editor.types';
import type { DraftSaveResult } from '@/widgets/editor/model/editor-core.types';
import { ResumeEditorCore, ResumePublishPanel } from '@/widgets/resume-editor';

type ResumeEditorClientProps = {
  initialDraftId?: string | null;
  initialContents: ResumeEditorState['contents'];
  initialPublishSettings: ResumePublishSettings;
  initialSavedAt?: string | null;
  onDraftSave?: (
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (
    settings: ResumePublishSettings,
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<void>;
  onUploadPdf?: (file: File) => Promise<ResumePublishSettings>;
};

/**
 * resume 전용 관리자 화면에서 편집 셸과 게시 패널을 연결합니다.
 */
export const ResumeEditorClient = ({
  initialDraftId = null,
  initialContents,
  initialPublishSettings,
  initialSavedAt = null,
  onDraftSave,
  onPublishSubmit,
  onUploadPdf,
}: ResumeEditorClientProps) => {
  const [isPublishPanelOpen, setIsPublishPanelOpen] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [editorState, setEditorState] = useState<ResumeEditorState>({
    contents: initialContents,
    dirty: false,
  });
  const [publishSettings, setPublishSettings] =
    useState<ResumePublishSettings>(initialPublishSettings);

  const handleDraftSave = async (state: ResumeEditorState) => {
    if (!onDraftSave) {
      return undefined;
    }

    const result = await onDraftSave(state, draftId);

    if (result?.draftId) {
      setDraftId(result.draftId);
    }

    return result;
  };

  /**
   * 편집 셸에서 현재 snapshot을 받아 게시 패널을 엽니다.
   */
  const handleOpenPublishPanel = (state: ResumeEditorState) => {
    setEditorState(state);
    setIsPublishPanelOpen(true);
  };

  /**
   * 게시 패널 제출 시 외부 저장 흐름이 없으면 로컬 설정만 유지합니다.
   */
  const handlePublishSubmit = async (settings: ResumePublishSettings) => {
    if (onPublishSubmit) {
      await onPublishSubmit(settings, editorState, draftId);
      return;
    }

    setPublishSettings(settings);
  };

  return (
    <>
      <ResumeEditorCore
        initialContents={initialContents}
        initialSavedAt={initialSavedAt}
        onDraftSave={handleDraftSave}
        onOpenPublishPanel={handleOpenPublishPanel}
      />
      <ResumePublishPanel
        editorState={editorState}
        initialSettings={publishSettings}
        isOpen={isPublishPanelOpen}
        onClose={() => setIsPublishPanelOpen(false)}
        onSubmit={handlePublishSubmit}
        onUploadPdf={
          onUploadPdf ??
          (file =>
            uploadPdfFileByKind({
              file,
              kind: 'resume',
            }))
        }
      />
    </>
  );
};
