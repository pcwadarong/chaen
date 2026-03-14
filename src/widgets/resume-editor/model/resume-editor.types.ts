'use client';

import type {
  ResumeEditorState,
  ResumePublishSettings,
} from '@/entities/resume/model/resume-editor.types';
import type { DraftSaveResult } from '@/widgets/editor/model/editor-core.types';

export type ResumeEditorCoreProps = {
  hideAppFrameFooter?: boolean;
  initialContents: ResumeEditorState['contents'];
  initialSavedAt?: string | null;
  onDraftSave?: (state: ResumeEditorState) => Promise<DraftSaveResult | void>;
  onOpenPublishPanel: (state: ResumeEditorState) => void;
};

export type ResumePublishPanelProps = {
  editorState: ResumeEditorState;
  initialSettings: ResumePublishSettings;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: ResumePublishSettings) => Promise<void>;
  onUploadPdf?: (file: File) => Promise<ResumePublishSettings>;
};
