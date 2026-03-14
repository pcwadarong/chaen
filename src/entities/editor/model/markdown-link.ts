import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

export type EditorLinkMode = 'card' | 'embed' | 'link' | 'preview';

type BuildEditorLinkInsertionInput = {
  clipboardText: string;
  selectedText: string;
};

type EditorLinkInsertion = {
  text: string;
  type: 'link';
};

type CreateMarkdownLinkByModeInput = {
  label: string;
  mode: EditorLinkMode;
  url: string;
};

/**
 * 선택 텍스트와 URL을 markdown 링크 문법으로 조합합니다.
 */
export const createMarkdownLink = (label: string, url: string, title?: string) => {
  const normalizedUrl = normalizeHttpUrl(url);
  const normalizedLabel = label.trim();

  if (!normalizedUrl) {
    return normalizedLabel ? label : url.trim();
  }

  const resolvedLabel = normalizedLabel ? label : normalizedUrl;
  const serializedTitle = title ? ` "${title}"` : '';

  return `[${resolvedLabel}](${normalizedUrl}${serializedTitle})`;
};

/**
 * 에디터에서 선택한 링크 모드에 맞는 markdown 문법을 생성합니다.
 */
export const createMarkdownLinkByMode = ({ label, mode, url }: CreateMarkdownLinkByModeInput) => {
  if (mode === 'embed') {
    const normalizedUrl = normalizeHttpUrl(url);

    if (!normalizedUrl) {
      return label.trim() || url.trim();
    }

    return `[embed](${normalizedUrl})`;
  }

  if (mode === 'preview' || mode === 'card') {
    return createMarkdownLink(label, url, mode);
  }

  return createMarkdownLink(label, url);
};

/**
 * "텍스트 + URL" 붙여넣기 형태를 markdown 링크 데이터로 추출합니다.
 */
const extractLabelAndUrl = (clipboardText: string) => {
  const match = clipboardText.trim().match(/^(?<label>.+?)\s+(?<url>https?:\/\/\S+)$/su);
  const label = match?.groups?.label?.trim() ?? '';
  const url = normalizeHttpUrl(match?.groups?.url);

  if (!label || !url) return null;

  return { label, url };
};

/**
 * clipboard 텍스트와 현재 선택 상태를 바탕으로 markdown 삽입 문법을 결정합니다.
 */
export const buildEditorLinkInsertion = ({
  clipboardText,
  selectedText,
}: BuildEditorLinkInsertionInput): EditorLinkInsertion | null => {
  const normalizedUrl = normalizeHttpUrl(clipboardText);
  const hasSelectedText = selectedText.trim().length > 0;

  if (normalizedUrl && hasSelectedText) {
    return {
      text: createMarkdownLink(selectedText, normalizedUrl),
      type: 'link',
    };
  }

  if (normalizedUrl) {
    return {
      text: createMarkdownLink(normalizedUrl, normalizedUrl),
      type: 'link',
    };
  }

  const extracted = extractLabelAndUrl(clipboardText);
  if (!extracted) return null;

  return {
    text: createMarkdownLink(extracted.label, extracted.url),
    type: 'link',
  };
};
