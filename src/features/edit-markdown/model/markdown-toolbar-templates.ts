const escapeMarkdownAltText = (value: string) => value.replaceAll(']', '\\]');

/**
 * escapeMarkdownLinkDestination
 *
 * 마크다운 링크 목적지에서 문자열을 안전하게 사용하기 위해 특수 문자를 이스케이프하거나 인코딩합니다.
 * `\`는 escape 구문과 충돌하지 않도록 `\\\\`로 이스케이프하고, `(`와 `)`는 링크 목적지 구문이
 * 조기 종료되지 않도록 각각 `\(`, `\)`로 변환합니다. `<`와 `>`는 자동 링크 또는 HTML 태그로
 * 해석되는 것을 막기 위해 각각 `%3C`, `%3E`로 인코딩합니다.
 *
 * @param value 마크다운 링크 목적지에 삽입할 원본 문자열입니다.
 * @returns 마크다운 링크 목적지에서 안전하게 사용할 수 있도록 정규화한 문자열입니다.
 */
const escapeMarkdownLinkDestination = (value: string) =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('<', '%3C')
    .replaceAll('>', '%3E');

const normalizeMathFormula = (value: string) => value.trim().replaceAll(/\s*\n+\s*/g, ' ');
const escapeJsxAttribute = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

export {
  createUploadedVideoEmbedMarkdown,
  createVideoEmbedMarkdown,
  createYoutubeEmbedMarkdown,
  extractVideoEmbedReference,
  extractYoutubeId,
} from '@/features/edit-markdown/model/video-embed';

/**
 * 이미지 embed markdown 문자열을 생성합니다.
 *
 * @param altText 이미지 대체 텍스트입니다.
 * @param url 이미지 URL입니다.
 * @returns markdown 이미지 문법 문자열을 반환합니다.
 */
export const createImageEmbedMarkdown = (altText: string, url: string) =>
  `![${escapeMarkdownAltText(altText)}](${escapeMarkdownLinkDestination(url)})`;

/**
 * 여러 이미지를 개별 markdown 이미지 문법 묶음으로 생성합니다.
 *
 * @param items 개별 이미지 alt/url 목록입니다.
 * @returns 개별 이미지 markdown 문자열을 빈 줄 기준으로 연결해 반환합니다.
 */
export const createImageEmbedMarkdownGroup = (items: Array<{ altText: string; url: string }>) =>
  items.map(item => createImageEmbedMarkdown(item.altText, item.url)).join('\n\n');

/**
 * gallery block markdown 문자열을 생성합니다.
 *
 * @param items 갤러리에 포함할 이미지 alt/url 목록입니다.
 * @returns gallery block markdown 문자열을 반환합니다.
 */
export const createImageGalleryMarkdown = (items: Array<{ altText: string; url: string }>) =>
  [
    ':::gallery',
    ...items.map(item => createImageEmbedMarkdown(item.altText, item.url)),
    ':::',
  ].join('\n');

/**
 * 첨부 파일 embed markdown 문자열을 생성합니다.
 *
 * @param contentType 첨부 파일 MIME 타입입니다.
 * @param fileName 본문에 표시할 원본 파일명입니다.
 * @param fileSize 첨부 파일 바이트 크기입니다.
 * @param url 첨부 파일 공개 URL입니다.
 * @returns 커스텀 Attachment markdown 문자열을 반환합니다.
 */
export const createAttachmentEmbedMarkdown = ({
  contentType,
  fileName,
  fileSize,
  url,
}: {
  contentType: string;
  fileName: string;
  fileSize: number;
  url: string;
}) =>
  `<Attachment href="${escapeJsxAttribute(url)}" name="${escapeJsxAttribute(fileName)}" size="${String(fileSize)}" type="${escapeJsxAttribute(contentType)}" />`;

/**
 * 수식 embed markdown 문자열을 생성합니다.
 *
 * @param formula 사용자가 입력한 LaTeX 수식 문자열입니다.
 * @param isBlock block 수식 여부입니다.
 * @returns 커스텀 Math markdown 문자열을 반환합니다.
 */
export const createMathEmbedMarkdown = ({
  formula,
  isBlock,
}: {
  formula: string;
  isBlock: boolean;
}) => {
  const normalizedFormula = normalizeMathFormula(formula);
  if (isBlock) {
    return `\n<Math block="true">${normalizedFormula}</Math>\n`;
  }

  return `<Math>${normalizedFormula}</Math>`;
};

/**
 * align block markdown 문자열을 생성합니다.
 *
 * @param align 정렬 방향입니다.
 * @returns align block markdown 문자열과 placeholder 선택 시작 위치를 반환합니다.
 */
export const createAlignBlockMarkdown = (align: 'center' | 'left' | 'right') => {
  const before = `:::align ${align}\n`;

  return {
    cursorOffset: before.length,
    text: `${before}텍스트\n:::`,
  };
};

/**
 * 토글 블록 markdown 문자열을 생성합니다.
 *
 * @param level 토글 제목에 붙일 heading 레벨입니다.
 * @param selectedText 선택된 제목 문자열입니다.
 * @returns 토글 블록 markdown 문자열과 기본 커서 오프셋을 반환합니다.
 */
export const createToggleBlockMarkdown = (level: 1 | 2 | 3 | 4, selectedText: string) => {
  const headingPrefix = '#'.repeat(level);

  if (!selectedText) {
    const prefix = `:::toggle ${headingPrefix} `;

    return {
      cursorOffset: prefix.length,
      text: `${prefix}\n:::`,
    };
  }

  return {
    cursorOffset: `:::toggle ${headingPrefix} `.length + selectedText.length,
    text: `:::toggle ${headingPrefix} ${selectedText}\n내용\n:::`,
  };
};
