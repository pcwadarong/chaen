import type { EditorContentType } from '@/entities/editor/model/editor-types';

/**
 * 에디터에서 선택한 영상 파일을 업로드 API에 전달하고 공개 URL을 반환합니다.
 *
 * @param options 영상 업로드 요청 정보입니다.
 * @param options.contentType 현재 편집 중인 콘텐츠 종류입니다.
 * @param options.file 업로드할 영상 파일 객체입니다.
 * @returns 업로드된 영상의 공개 URL을 반환합니다.
 * @throws 업로드 요청이 실패했거나 응답에 URL이 없으면 예외를 던집니다.
 */
export const uploadEditorVideo = async ({
  contentType,
  file,
}: {
  contentType: EditorContentType;
  file: File;
}): Promise<string> => {
  const formData = new FormData();

  formData.set('contentType', contentType);
  formData.set('file', file);

  const response = await fetch('/api/videos', {
    body: formData,
    method: 'POST',
  });
  const body = (await response.json()) as { error?: string; message?: string; url?: string };

  if (!response.ok || !body.url) {
    throw new Error(body.error ?? body.message ?? 'Video upload failed');
  }

  return body.url;
};
