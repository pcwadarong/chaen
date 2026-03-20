'use client';

import type { DraftSaveResult } from '@/entities/editor/model/editor-types';
import type {
  ResumeEditorState,
  ResumePublishSettings,
} from '@/entities/resume/model/resume-editor.types';

export type ResumeEditorCoreProps = {
  hideAppFrameFooter?: boolean;
  initialContents: ResumeEditorState['contents'];
  initialPublishSettings: ResumePublishSettings;
  initialSavedAt?: string | null;
  onDraftSave?: (state: ResumeEditorState) => Promise<DraftSaveResult | void>;
  onPublish?: (state: ResumeEditorState, settings: ResumePublishSettings) => Promise<void>;
};
