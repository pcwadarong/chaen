export const EDITOR_LOCALES = ['ko', 'en', 'ja', 'fr'] as const;

export type Locale = (typeof EDITOR_LOCALES)[number];

export interface TranslationField {
  content: string;
  description: string;
  download_button_label?: string;
  title: string;
}

export interface EditorState {
  dirty: boolean;
  slug: string;
  tags: string[];
  translations: Record<Locale, TranslationField>;
}

export type DraftSaveResult = {
  draftId?: string;
  savedAt?: string | null;
};

export type PublishActionResult = {
  redirectPath: string;
};

export type EditorContentType = 'article' | 'project' | 'resume';
export type EditorPublicationState = 'draft' | 'published' | 'scheduled';
export type PublishVisibility = 'public' | 'private';

export type EditorLocaleValidation = {
  hasContentWithoutTitle: boolean;
  hasCompleteTranslation: boolean;
};

export type EditorValidationResult = {
  canSave: boolean;
  hasAnyCompleteTranslation: boolean;
  localeValidation: Record<Locale, EditorLocaleValidation>;
};

export interface PublishSettings {
  allowComments: boolean;
  publishAt: string | null;
  slug: string;
  thumbnailUrl: string;
  visibility: PublishVisibility;
}
