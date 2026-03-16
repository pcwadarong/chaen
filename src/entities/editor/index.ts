export { checkSlugDuplicate } from '@/entities/editor/api/check-slug-duplicate';
export type { EditorDraftSummary, EditorSeed } from '@/entities/editor/api/editor.types';
export {
  deleteEditorDraftAction,
  publishEditorContentAction,
  saveEditorDraftAction,
} from '@/entities/editor/api/editor-actions';
export {
  createEditorSeed,
  getEditorDraftSeed,
  getEditorDraftSummaries,
  getEditorSeed,
} from '@/entities/editor/api/editor-read';
export {
  createEditorError,
  EDITOR_ERROR_MESSAGE,
  parseEditorError,
  resolveEditorErrorMessage,
  resolveEditorPublishInlineErrorField,
} from '@/entities/editor/model/editor-error';
export {
  createEmptyTranslations,
  formatSavedAtLabel,
  isEditorStateEqual,
  normalizeEditorState,
  normalizeTagSlugs,
  validateEditorState,
} from '@/entities/editor/model/editor-state-utils';
export {
  type DraftSaveResult,
  EDITOR_LOCALES,
  type EditorContentType,
  type EditorLocaleValidation,
  type EditorPublicationState,
  type EditorState,
  type EditorValidationResult,
  type Locale,
  type PublishSettings,
  type PublishVisibility,
  type TranslationField,
} from '@/entities/editor/model/editor-types';
export {
  buildEditorLinkInsertion,
  createMarkdownLink,
  createMarkdownLinkByMode,
} from '@/entities/editor/model/markdown-link';
export {
  applyTextareaTransform,
  continueMarkdownList,
  focusTextarea,
  getPendingSelection,
  indentMarkdownList,
  insertTemplate,
  outdentMarkdownList,
  prefixLine,
  restoreCursor,
  toggleHeadingLine,
  wrapSelection,
} from '@/entities/editor/model/selection-utils';
