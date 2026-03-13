'use client';

import React, { useState } from 'react';

import {
  type DraftSaveResult,
  type EditorContentType,
  EditorCore,
  type EditorState,
  type Locale,
  PublishPanel,
  type PublishSettings,
  type TranslationField,
} from '@/widgets/editor';

type EditorClientProps = {
  availableTags: {
    id: string;
    label: string;
    slug: string;
  }[];
  contentId?: string;
  contentType: EditorContentType;
  initialDraftId?: string | null;
  initialPublished?: boolean;
  initialSavedAt?: string | null;
  initialSettings?: PublishSettings;
  initialSlug?: string;
  initialTags?: string[];
  initialTranslations: Record<Locale, TranslationField>;
  onDraftSave?: (state: EditorState, draftId?: string | null) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (
    settings: PublishSettings,
    editorState: EditorState,
    draftId?: string | null,
  ) => Promise<void>;
};

/**
 * 관리자 article/project 편집 페이지에서 EditorCore와 PublishPanel을 연결합니다.
 */
export const EditorClient = ({
  availableTags,
  contentId,
  contentType,
  initialDraftId = null,
  initialPublished = false,
  initialSavedAt = null,
  initialSettings,
  initialSlug = '',
  initialTags = [],
  initialTranslations,
  onDraftSave,
  onPublishSubmit,
}: EditorClientProps) => {
  const [isPublishPanelOpen, setIsPublishPanelOpen] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    dirty: false,
    slug: initialSlug,
    tags: initialTags,
    translations: initialTranslations,
  }));
  const [publishSettings, setPublishSettings] = useState<PublishSettings | undefined>(
    initialSettings,
  );

  /**
   * EditorCore의 단일 인자 callback 계약을 draftId 추적 가능한 형태로 감쌉니다.
   */
  const handleDraftSave = async (state: EditorState) => {
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
   * EditorCore에서 현재 snapshot을 받아 발행 패널을 엽니다.
   */
  const handleOpenPublishPanel = (state: EditorState) => {
    setEditorState(state);
    setPublishSettings(previous =>
      previous
        ? {
            ...previous,
            slug: state.slug,
          }
        : undefined,
    );
    setIsPublishPanelOpen(true);
  };

  /**
   * 발행 패널 제출 시 server action 또는 로컬 상태를 갱신합니다.
   */
  const handlePublishSubmit = async (settings: PublishSettings) => {
    if (onPublishSubmit) {
      await onPublishSubmit(settings, editorState, draftId);
      return;
    }

    setPublishSettings(settings);
  };

  return (
    <>
      <EditorCore
        availableTags={availableTags}
        contentId={contentId}
        contentType={contentType}
        initialPublished={initialPublished}
        initialSavedAt={initialSavedAt}
        initialSlug={initialSlug}
        initialTags={initialTags}
        initialTranslations={initialTranslations}
        onDraftSave={handleDraftSave}
        onOpenPublishPanel={handleOpenPublishPanel}
      />
      <PublishPanel
        contentId={contentId}
        contentType={contentType}
        editorState={editorState}
        initialSettings={publishSettings}
        isOpen={isPublishPanelOpen}
        isPublished={initialPublished}
        onClose={() => setIsPublishPanelOpen(false)}
        onSubmit={handlePublishSubmit}
      />
    </>
  );
};
