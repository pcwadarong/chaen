/**
 * 외부 링크 URL을 정규화합니다.
 * - 공백 제거
 * - `http:`, `https:`만 허용
 * - 그 외 스킴이거나 URL 파싱에 실패하면 `null`
 */
export const normalizeHttpUrl = (rawUrl: string | null | undefined): string | null => {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};
