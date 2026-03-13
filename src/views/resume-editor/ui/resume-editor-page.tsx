import React from 'react';

import type { ResumeEditorContentMap } from '@/entities/resume/api/resume-editor-read';
import { ResumeEditorClient } from '@/views/resume-editor/ui/resume-editor-client';

type ResumeEditorPageProps = {
  initialContents: ResumeEditorContentMap;
};

/**
 * resume 전용 관리자 편집 페이지입니다.
 */
export const ResumeEditorPage = ({ initialContents }: ResumeEditorPageProps) => (
  <ResumeEditorClient initialContents={initialContents} />
);
