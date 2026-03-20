'use client';

import type { DraftSaveResult } from '@/entities/editor/model/editor-types';
import type { ResumeEditorState } from '@/entities/resume/model/resume-editor.types';

export type ResumeEditorCoreProps = {
  hideAppFrameFooter?: boolean;
  initialContents: ResumeEditorState['contents'];
  initialSavedAt?: string | null;
  onDraftSave?: (state: ResumeEditorState) => Promise<DraftSaveResult | void>;
  onPublish?: (state: ResumeEditorState) => Promise<void>;
};
