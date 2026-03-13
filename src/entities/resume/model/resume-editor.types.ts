'use client';

import type { PdfFileContent } from '@/entities/pdf-file/model/types';
import type { Locale } from '@/widgets/editor';

export type ResumeEditorContent = Pick<
  PdfFileContent,
  'body' | 'description' | 'download_button_label' | 'download_unavailable_label' | 'title'
>;

export type ResumeEditorContentMap = Record<Locale, ResumeEditorContent>;

export type ResumeEditorState = {
  contents: ResumeEditorContentMap;
  dirty: boolean;
};

export type ResumePublishSettings = {
  downloadFileName: string;
  downloadPath: string;
  filePath: string;
  isPdfReady: boolean;
};

export type ResumePublishValidationErrors = {
  koBody?: string;
  koTitle?: string;
  pdf?: string;
};

export type ResumeEditorSeed = {
  initialDraftId?: string | null;
  initialContents: ResumeEditorContentMap;
  initialPublishSettings: ResumePublishSettings;
  initialSavedAt: string | null;
};

export type ResumeDraftSeed = {
  contents: ResumeEditorContentMap;
  draftId: string;
  updatedAt: string;
};
