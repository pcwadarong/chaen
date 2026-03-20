'use client';

import type { Locale } from '@/entities/editor/model/editor-types';
import type { PdfFileContent } from '@/entities/pdf-file/model/types';

export type ResumeEditorContent = Pick<
  PdfFileContent,
  'body' | 'description' | 'download_button_label' | 'title'
>;

export type ResumeEditorContentMap = Record<Locale, ResumeEditorContent>;

export type ResumeEditorState = {
  contents: ResumeEditorContentMap;
  dirty: boolean;
};

export type ResumePublishValidationErrors = {
  koBody?: string;
  koTitle?: string;
};

export type ResumeEditorSeed = {
  initialDraftId?: string | null;
  initialContents: ResumeEditorContentMap;
  initialSavedAt: string | null;
};

export type ResumeDraftSeed = {
  contents: ResumeEditorContentMap;
  draftId: string;
  updatedAt: string;
};
