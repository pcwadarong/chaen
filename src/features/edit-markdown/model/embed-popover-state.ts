import { EDITOR_ERROR_MESSAGE } from '@/entities/editor/model/editor-error';
import type { EditorContentType } from '@/entities/editor/model/editor-types';

type UploadEditorImageForEmbed = (input: {
  contentType: EditorContentType;
  file: File;
  imageKind: 'content';
}) => Promise<string>;

type UploadImageEmbedSourceParams = {
  contentType: EditorContentType;
  file: File;
  uploadEditorImage: UploadEditorImageForEmbed;
};

type UploadImageEmbedSourceResult = {
  errorMessage: string | null;
  url: string | null;
};

/**
 * 팝오버 입력값을 trim 기준으로 정리하고 비어 있으면 null을 반환합니다.
 *
 * @param value 사용자가 입력한 원본 문자열입니다.
 * @returns trim된 문자열 또는 비어 있을 때 null을 반환합니다.
 */
export const normalizeEmbedInput = (value: string) => {
  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue : null;
};

/**
 * 줄 단위 이미지 URL 입력값을 정리하고, 비어 있는 줄과 중복 URL을 제거합니다.
 *
 * @param value 사용자가 textarea에 입력한 원본 문자열입니다.
 * @returns trim 및 중복 제거가 반영된 URL 목록을 반환합니다.
 */
export const normalizeEmbedInputList = (value: string) => {
  const dedupedValues = new Set<string>();

  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      dedupedValues.add(line);
    });

  return Array.from(dedupedValues);
};

/**
 * 이미지 팝오버 업로드 결과를 URL 또는 사용자용 에러 메시지로 정규화합니다.
 *
 * @param contentType 현재 에디터 콘텐츠 타입입니다.
 * @param file 사용자가 선택한 이미지 파일입니다.
 * @param uploadEditorImage 실제 업로드 실행 함수입니다.
 * @returns 성공 시 URL, 실패 시 사용자 메시지를 포함한 결과를 반환합니다.
 */
export const uploadImageEmbedSource = async ({
  contentType,
  file,
  uploadEditorImage,
}: UploadImageEmbedSourceParams): Promise<UploadImageEmbedSourceResult> => {
  try {
    return {
      errorMessage: null,
      url: await uploadEditorImage({
        contentType,
        file,
        imageKind: 'content',
      }),
    };
  } catch (error) {
    console.error('uploadImageEmbedSource failed', {
      contentType,
      error,
      imageKind: 'content',
    });

    return {
      errorMessage: EDITOR_ERROR_MESSAGE.imageUploadFailedWithRetry,
      url: null,
    };
  }
};
