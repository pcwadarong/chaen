import type { EditorContentType } from '@/entities/editor/model/editor-types';

type UploadEditorVideoOptions = {
  contentType: EditorContentType;
  file: File;
  onProgress?: (percentage: number) => void;
  signal?: AbortSignal;
};

/**
 * XHR 업로드를 중단했을 때 사용할 표준화된 AbortError를 생성합니다.
 *
 * @returns 업로드 취소를 나타내는 AbortError 예외 객체를 반환합니다.
 */
const createAbortUploadError = () => {
  const error = new Error('Video upload aborted');

  error.name = 'AbortError';

  return error;
};

/**
 * XHR 응답 본문을 안전하게 JSON으로 파싱합니다.
 *
 * @param responseText XHR이 반환한 원본 응답 문자열입니다.
 * @returns 파싱된 응답 객체를 반환합니다.
 */
const parseUploadResponse = (responseText: string) => {
  try {
    return JSON.parse(responseText) as { error?: string; message?: string; url?: string };
  } catch {
    return {};
  }
};

/**
 * 에디터에서 선택한 영상 파일을 업로드 API에 전달하고 공개 URL을 반환합니다.
 *
 * @param options 영상 업로드 요청 정보입니다.
 * @param options.contentType 현재 편집 중인 콘텐츠 종류입니다.
 * @param options.file 업로드할 영상 파일 객체입니다.
 * @param options.onProgress 업로드 진행률이 바뀔 때 호출할 콜백입니다.
 * @param options.signal 업로드 취소를 제어할 AbortSignal입니다.
 * @returns 업로드된 영상의 공개 URL을 반환합니다.
 * @throws 업로드 요청이 실패했거나 응답에 URL이 없으면 예외를 던집니다.
 */
export const uploadEditorVideo = async ({
  contentType,
  file,
  onProgress,
  signal,
}: UploadEditorVideoOptions): Promise<string> => {
  const formData = new FormData();

  formData.set('contentType', contentType);
  formData.set('file', file);

  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    /**
     * signal 구독과 XHR 이벤트를 정리합니다.
     */
    const cleanup = () => {
      xhr.upload.onprogress = null;
      xhr.onload = null;
      xhr.onerror = null;
      xhr.onabort = null;
      signal?.removeEventListener('abort', handleAbortSignal);
    };

    /**
     * 외부 AbortSignal이 취소되면 XHR 업로드도 함께 중단합니다.
     */
    const handleAbortSignal = () => {
      xhr.abort();
    };

    xhr.open('POST', '/api/videos');

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return;

      onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      cleanup();

      const body = parseUploadResponse(xhr.responseText);

      if (xhr.status < 200 || xhr.status >= 300 || !body.url) {
        reject(new Error(body.error ?? body.message ?? 'Video upload failed'));
        return;
      }

      resolve(body.url);
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error('Video upload failed'));
    };

    xhr.onabort = () => {
      cleanup();
      reject(createAbortUploadError());
    };

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }

      signal.addEventListener('abort', handleAbortSignal, { once: true });
    }

    xhr.send(formData);
  });
};
