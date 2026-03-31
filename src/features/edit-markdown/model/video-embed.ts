export type VideoProvider = 'upload' | 'youtube';

export type YoutubeVideoEmbedReference = {
  provider: 'youtube';
  videoId: string;
};

export type UploadVideoEmbedReference = {
  provider: 'upload';
  src: string;
};

export type VideoEmbedReference = UploadVideoEmbedReference | YoutubeVideoEmbedReference;

const escapeJsxAttribute = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/**
 * pathname에서 첫 번째 비어 있지 않은 segment를 읽습니다.
 *
 * @param pathname URL pathname 문자열입니다.
 * @returns 첫 번째 유효 path segment 또는 null을 반환합니다.
 */
const getFirstPathSegment = (pathname: string) =>
  pathname.split('/').find(segment => segment.length > 0) ?? null;

/**
 * 사용자가 입력한 영상 URL에서 provider와 video id를 추출합니다.
 * 현재는 YouTube만 지원하며, 안전한 도메인에서만 reference를 생성합니다.
 *
 * @param value 사용자가 입력한 영상 URL 문자열입니다.
 * @returns 추출 가능한 provider/id 쌍 또는 null을 반환합니다.
 */
export const extractVideoEmbedReference = (value: string): VideoEmbedReference | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  try {
    const url = new URL(trimmedValue);
    const isYoutubeDomain = url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com');

    if (url.hostname === 'youtu.be') {
      const videoId = getFirstPathSegment(url.pathname);

      return videoId
        ? {
            provider: 'youtube',
            videoId,
          }
        : null;
    }

    if (isYoutubeDomain) {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');

        return videoId
          ? {
              provider: 'youtube',
              videoId,
            }
          : null;
      }

      const [, firstSegment, secondSegment] = url.pathname.split('/');

      if (firstSegment === 'shorts' && secondSegment) {
        return {
          provider: 'youtube',
          videoId: secondSegment,
        };
      }

      if (firstSegment === 'embed' && secondSegment) {
        return {
          provider: 'youtube',
          videoId: secondSegment,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * 다양한 YouTube URL 형태에서 video id만 추출합니다.
 * 기존 호출 경로 호환을 위해 `extractVideoEmbedReference` 결과를 축약해 제공합니다.
 *
 * @param value 사용자가 입력한 YouTube URL 문자열입니다.
 * @returns 안전한 호스트에서 추출한 video id 또는 null을 반환합니다.
 */
export const extractYoutubeId = (value: string) =>
  (() => {
    const reference = extractVideoEmbedReference(value);

    return reference?.provider === 'youtube' ? reference.videoId : null;
  })();

/**
 * Video embed markdown 문자열을 생성합니다.
 *
 * @param provider video provider 식별자입니다.
 * @param videoId provider 내부 video id입니다.
 * @returns 커스텀 Video markdown 문자열을 반환합니다.
 */
export const createVideoEmbedMarkdown = (reference: VideoEmbedReference) => {
  if (reference.provider === 'upload') {
    return `<Video provider="upload" src="${escapeJsxAttribute(reference.src)}" />`;
  }

  return `<Video provider="${reference.provider}" id="${escapeJsxAttribute(reference.videoId)}" />`;
};

/**
 * YouTube video id만 받아 Video markdown 문자열을 생성합니다.
 * 기존 호출 경로 호환을 위해 유지합니다.
 *
 * @param videoId YouTube video id입니다.
 * @returns 커스텀 Video markdown 문자열을 반환합니다.
 */
export const createYoutubeEmbedMarkdown = (videoId: string) =>
  createVideoEmbedMarkdown({
    provider: 'youtube',
    videoId,
  });

/**
 * 업로드된 영상 공개 URL로 Video markdown 문자열을 생성합니다.
 *
 * @param src 업로드된 영상의 공개 URL입니다.
 * @returns upload provider를 포함한 Video markdown 문자열을 반환합니다.
 */
export const createUploadedVideoEmbedMarkdown = (src: string) =>
  createVideoEmbedMarkdown({
    provider: 'upload',
    src,
  });
