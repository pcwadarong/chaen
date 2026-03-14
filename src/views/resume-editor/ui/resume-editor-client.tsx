'use client';

import React, { useCallback, useState } from 'react';

import type { DraftSaveResult } from '@/entities/editor/model/editor-types';
import { uploadPdfFileByKind } from '@/entities/pdf-file/api/upload-pdf-file-by-kind';
import type {
  ResumeEditorState,
  ResumePublishSettings,
} from '@/entities/resume/model/resume-editor.types';
import { ResumeEditorCore, ResumePublishPanel } from '@/widgets/resume-editor';

type ResumeEditorClientProps = {
  hideAppFrameFooter?: boolean;
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

const MemoizedResumeEditorCore = React.memo(ResumeEditorCore);
const MemoizedResumePublishPanel = React.memo(ResumePublishPanel);

/**
 * resume 전용 관리자 화면에서 편집 셸과 게시 패널을 연결합니다.
 */
export const ResumeEditorClient = ({
  hideAppFrameFooter = false,
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
   * 편집 셸에서 현재 snapshot을 받아 게시 패널을 엽니다.
   */
  const handleOpenPublishPanel = useCallback((state: ResumeEditorState) => {
    setEditorState(state);
    setIsPublishPanelOpen(true);
  }, []);

  /**
   * 게시 패널을 닫습니다.
   */
  const handleClosePublishPanel = useCallback(() => {
    setIsPublishPanelOpen(false);
  }, []);

  /**
   * 게시 패널 제출 시 외부 저장 흐름이 없으면 로컬 설정만 유지합니다.
   */
  const handlePublishSubmit = useCallback(
    async (settings: ResumePublishSettings) => {
      if (onPublishSubmit) {
        await onPublishSubmit(settings, editorState, draftId);
        return;
      }

      setPublishSettings(settings);
    },
    [draftId, editorState, onPublishSubmit],
  );

  /**
   * PDF 업로드 처리를 기본 구현 또는 외부 주입 구현에 연결합니다.
   */
  const handleUploadPdf = useCallback(
    (file: File) =>
      onUploadPdf
        ? onUploadPdf(file)
        : uploadPdfFileByKind({
            file,
            kind: 'resume',
          }),
    [onUploadPdf],
  );

  return (
    <>
      <MemoizedResumeEditorCore
        hideAppFrameFooter={hideAppFrameFooter}
        initialContents={initialContents}
        initialSavedAt={initialSavedAt}
        onDraftSave={handleDraftSave}
        onOpenPublishPanel={handleOpenPublishPanel}
      />
      <MemoizedResumePublishPanel
        editorState={editorState}
        initialSettings={publishSettings}
        isOpen={isPublishPanelOpen}
        onClose={handleClosePublishPanel}
        onSubmit={handlePublishSubmit}
        onUploadPdf={handleUploadPdf}
      />
    </>
  );
};
