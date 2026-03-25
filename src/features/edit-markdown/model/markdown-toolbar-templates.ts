const escapeMarkdownAltText = (value: string) => value.replaceAll(']', '\\]');

const escapeMarkdownLinkDestination = (value: string) =>
  value.replaceAll('<', '%3C').replaceAll('>', '%3E');

const escapeJsxAttribute = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/**
 * pathname에서 첫 번째 비어 있지 않은 segment를 읽습니다.
 *
 * @param pathname URL pathname 문자열입니다.
 * @returns 첫 번째 유효 path segment 또는 null을 반환합니다.
 */
export const getFirstPathSegment = (pathname: string) =>
  pathname.split('/').find(segment => segment.length > 0) ?? null;

/**
 * 다양한 YouTube URL 형태에서 video id를 추출합니다.
 *
 * @param value 사용자가 입력한 YouTube URL 문자열입니다.
 * @returns 안전한 호스트에서 추출한 video id 또는 null을 반환합니다.
 */
export const extractYoutubeId = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  try {
    const url = new URL(trimmedValue);
    const isYoutubeDomain = url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com');

    if (url.hostname === 'youtu.be') {
      return getFirstPathSegment(url.pathname);
    }

    if (isYoutubeDomain) {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }

      const [, firstSegment, secondSegment] = url.pathname.split('/');

      if (firstSegment === 'shorts' && secondSegment) {
        return secondSegment;
      }

      if (firstSegment === 'embed' && secondSegment) {
        return secondSegment;
      }
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * 이미지 embed markdown 문자열을 생성합니다.
 *
 * @param altText 이미지 대체 텍스트입니다.
 * @param url 이미지 URL입니다.
 * @returns markdown 이미지 문법 문자열을 반환합니다.
 */
export const createImageEmbedMarkdown = (altText: string, url: string) =>
  `![${escapeMarkdownAltText(altText)}](<${escapeMarkdownLinkDestination(url)}>)`;

/**
 * YouTube embed markdown 문자열을 생성합니다.
 *
 * @param videoId YouTube video id입니다.
 * @returns 커스텀 YouTube markdown 문자열을 반환합니다.
 */
export const createYoutubeEmbedMarkdown = (videoId: string) =>
  `<YouTube id="${escapeJsxAttribute(videoId)}" />`;

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
