/**
 * 이미지 미리보기 용 URL을 생성합니다.
 * `download` 성격의 쿼리를 제거해 새 탭에서 파일 저장 대신 이미지 뷰로 열리도록 맞춥니다.
 */
export const createImageViewerUrl = (rawUrl: string, baseUrl?: string): string => {
  const normalized = rawUrl.trim();

  if (!normalized) return rawUrl;

  try {
    if (/^https?:\/\//i.test(normalized)) {
      const parsedUrl = new URL(normalized);

      parsedUrl.searchParams.delete('download');
      parsedUrl.searchParams.delete('response-content-disposition');

      return parsedUrl.toString();
    }

    if (baseUrl) {
      const parsedUrl = new URL(normalized, baseUrl);

      parsedUrl.searchParams.delete('download');
      parsedUrl.searchParams.delete('response-content-disposition');

      return parsedUrl.toString();
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
};
