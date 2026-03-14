import type {
  EditorContentType,
  EditorPublicationState,
  Locale,
  PublishSettings,
  TranslationField,
} from '@/entities/editor/model/editor-types';

export type EditorSeed = {
  contentId?: string;
  contentType: EditorContentType;
  initialDraftId?: string | null;
  initialPublicationState?: EditorPublicationState;
  initialPublished: boolean;
  initialSavedAt: string | null;
  initialSettings?: PublishSettings;
  initialSlug: string;
  initialTags: string[];
  initialTranslations: Record<Locale, TranslationField>;
};

export type EditorDraftSummary = {
  contentId: string | null;
  contentType: EditorContentType;
  id: string;
  title: string;
  updatedAt: string;
};
