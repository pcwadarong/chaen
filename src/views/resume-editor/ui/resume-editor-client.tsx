'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';

import type {
  DraftSaveResult,
  EditorState,
  PublishActionResult,
} from '@/entities/editor/model/editor-types';
import type { ResumeEditorState } from '@/entities/resume/model/resume-editor.types';
import { resumeContentMapToEditorTranslations } from '@/entities/resume/model/resume-editor.utils';
import { parseResumeEditorError } from '@/entities/resume/model/resume-editor-error';
import {
  resolveResumePublishNavigationMode,
  submitResumeDraft,
  submitResumePublish,
} from '@/views/resume-editor/model/resume-editor-client-actions';
import { EditorCore } from '@/widgets/editor';

type ResumeEditorClientProps = {
  hideAppFrameFooter?: boolean;
  initialDraftId?: string | null;
  initialContents: ResumeEditorState['contents'];
  initialSavedAt?: string | null;
  onDraftSave: (
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (
    state: ResumeEditorState,
    draftId?: string | null,
  ) => Promise<PublishActionResult | void>;
};

const MemoizedEditorCore = React.memo(EditorCore);

/**
 * resume 전용 관리자 화면에서 편집 셸과 서버 액션을 연결합니다.
 */
export const ResumeEditorClient = ({
  hideAppFrameFooter = false,
  initialDraftId = null,
  initialContents,
  initialSavedAt = null,
  onDraftSave,
  onPublishSubmit,
}: ResumeEditorClientProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);

  const handleDraftSave = useCallback(
    async (state: EditorState) => {
      const { nextDraftId, result } = await submitResumeDraft({
        draftId,
        onDraftSave,
        state,
      });

      if (nextDraftId !== draftId) {
        setDraftId(nextDraftId);
      }

      return result;
    },
    [draftId, onDraftSave],
  );

  /**
   * 편집 셸 하단 발행 버튼을 서버 발행 흐름에 연결합니다.
   */
  const handlePublish = useCallback(
    async (state: EditorState) => {
      if (!onPublishSubmit) {
        return;
      }

      const { redirectPath } = await submitResumePublish({
        draftId,
        onPublishSubmit,
        state,
      });

      if (redirectPath) {
        const navigationMode = resolveResumePublishNavigationMode({
          currentPathname: pathname,
          redirectPath,
        });

        if (navigationMode === 'replace-refresh') {
          router.replace(redirectPath);
          router.refresh();
          return;
        }

        router.push(redirectPath);
      }
    },
    [draftId, onPublishSubmit, pathname, router],
  );

  return (
    <MemoizedEditorCore
      availableTags={[]}
      contentType="resume"
      enableAutosave
      hideAppFrameFooter={hideAppFrameFooter}
      hideTagSelector
      initialSlug=""
      initialTags={[]}
      initialSavedAt={initialSavedAt}
      initialTranslations={resumeContentMapToEditorTranslations(initialContents)}
      onDraftSave={handleDraftSave}
      onDirectPublish={onPublishSubmit ? handlePublish : undefined}
      onDirectPublishError={error => parseResumeEditorError(error, 'publishFailed').message}
    />
  );
};
