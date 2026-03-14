import type {
  EditorContentType,
  EditorPublicationState,
  Locale,
  PublishSettings,
  TranslationField,
} from '@/widgets/editor/model/editor-core.types';

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
