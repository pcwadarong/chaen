/**
 * 구글 검색 래핑 URL(`https://www.google.com/search?q=...`)에서 원본 URL을 추출합니다.
 */
const unwrapGoogleSearchUrl = (url: URL): string | null => {
  if (url.hostname !== 'www.google.com' || !url.pathname.startsWith('/search')) return null;

  const queryTarget = url.searchParams.get('q');
  if (!queryTarget) return null;

  try {
    return new URL(queryTarget).toString();
  } catch {
    return null;
  }
};

/**
 * 이미지 URL을 정규화합니다.
 * - 공백 제거
 * - 구글 검색 래핑 URL은 원본 URL로 언랩
 * - URL이 아니면 null
 */
export const normalizeImageUrl = (rawUrl: string | null | undefined): string | null => {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const unwrapped = unwrapGoogleSearchUrl(parsed);

    return unwrapped ?? parsed.toString();
  } catch {
    return null;
  }
};
