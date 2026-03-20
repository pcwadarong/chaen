'use client';

import React, { useCallback, useState } from 'react';

import {
  type DraftSaveResult,
  type EditorContentType,
  EditorCore,
  type EditorPublicationState,
  type EditorState,
  type Locale,
  PublishPanel,
  type PublishSettings,
  type TranslationField,
} from '@/widgets/editor';
import { createDefaultPublishSettings } from '@/widgets/editor/ui/publish/publish-panel.utils';

type EditorClientProps = {
  availableTags: {
    id: string;
    label: string;
    slug: string;
  }[];
  contentId?: string;
  contentType: EditorContentType;
  hideAppFrameFooter?: boolean;
  initialDraftId?: string | null;
  initialPublicationState?: EditorPublicationState;
  initialPublished?: boolean;
  initialSavedAt?: string | null;
  initialSettings?: PublishSettings;
  initialSlug?: string;
  initialTags?: string[];
  initialTranslations: Record<Locale, TranslationField>;
  onDraftSave?: (
    state: EditorState,
    settings: PublishSettings,
    draftId?: string | null,
  ) => Promise<DraftSaveResult | void>;
  onPublishSubmit?: (
    settings: PublishSettings,
    editorState: EditorState,
    draftId?: string | null,
  ) => Promise<void>;
};

const EMPTY_TAGS: string[] = [];
const MemoizedEditorCore = React.memo(EditorCore);
const MemoizedPublishPanel = React.memo(PublishPanel);

/**
 * 관리자 article/project 편집 페이지에서 EditorCore와 PublishPanel을 연결합니다.
 */
export const EditorClient = ({
  availableTags,
  contentId,
  contentType,
  hideAppFrameFooter = false,
  initialDraftId = null,
  initialPublicationState = 'draft',
  initialPublished = false,
  initialSavedAt = null,
  initialSettings,
  initialSlug = '',
  initialTags = EMPTY_TAGS,
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
  const [publishSettings, setPublishSettings] = useState<PublishSettings>(() =>
    createDefaultPublishSettings({
      contentType,
      initialSettings,
      slug: initialSlug,
    }),
  );

  /**
   * EditorCore의 단일 인자 callback 계약을 draftId 추적 가능한 형태로 감쌉니다.
   */
  const handleDraftSave = useCallback(
    async (state: EditorState) => {
      if (!onDraftSave) {
        return undefined;
      }

      const result = await onDraftSave(state, publishSettings, draftId);

      if (result?.draftId) {
        setDraftId(result.draftId);
      }

      return result;
    },
    [draftId, onDraftSave, publishSettings],
  );

  /**
   * EditorCore에서 현재 snapshot을 받아 발행 패널을 엽니다.
   */
  const handleOpenPublishPanel = useCallback((state: EditorState) => {
    setEditorState(state);
    setIsPublishPanelOpen(true);
  }, []);

  /**
   * 발행 패널을 닫습니다.
   */
  const handleClosePublishPanel = useCallback(() => {
    setIsPublishPanelOpen(false);
  }, []);

  /**
   * 발행 패널에서 편집한 설정을 로컬 상태에 반영합니다.
   */
  const handleSettingsChange = useCallback((settings: PublishSettings) => {
    setPublishSettings(settings);
  }, []);

  /**
   * 발행 패널 제출 시 server action 또는 로컬 상태를 갱신합니다.
   */
  const handlePublishSubmit = useCallback(
    async (settings: PublishSettings) => {
      setPublishSettings(settings);

      if (onPublishSubmit) {
        await onPublishSubmit(settings, editorState, draftId);
      }
    },
    [draftId, editorState, onPublishSubmit],
  );

  return (
    <>
      <MemoizedEditorCore
        availableTags={availableTags}
        contentId={contentId}
        contentType={contentType}
        hideAppFrameFooter={hideAppFrameFooter}
        initialPublished={initialPublished}
        initialSavedAt={initialSavedAt}
        initialSlug={initialSlug}
        initialTags={initialTags}
        initialTranslations={initialTranslations}
        onDraftSave={handleDraftSave}
        onOpenPublishPanel={handleOpenPublishPanel}
      />
      <MemoizedPublishPanel
        contentId={contentId}
        contentType={contentType}
        editorState={editorState}
        initialSettings={publishSettings}
        isOpen={isPublishPanelOpen}
        isPublished={initialPublished}
        publicationState={initialPublicationState}
        onClose={handleClosePublishPanel}
        onSettingsChange={handleSettingsChange}
        onSubmit={handlePublishSubmit}
      />
    </>
  );
};
