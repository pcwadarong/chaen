import type { EditorContentType } from '@/entities/editor/model/editor-types';
import { optimizeThumbnailImageFile } from '@/shared/lib/image/optimize-thumbnail-image-file';

/**
 * 에디터에서 선택한 이미지를 최적화한 뒤 업로드 API에 전달하고 공개 URL을 반환합니다.
 */
export const uploadEditorImage = async ({
  contentType,
  file,
}: {
  contentType: EditorContentType;
  file: File;
}): Promise<string> => {
  const optimizedFile = await optimizeThumbnailImageFile(file);
  const formData = new FormData();

  formData.set('contentType', contentType);
  formData.set('file', optimizedFile);

  const response = await fetch('/api/images', {
    body: formData,
    method: 'POST',
  });
  const body = (await response.json()) as { error?: string; message?: string; url?: string };

  if (!response.ok || !body.url) {
    throw new Error(body.error ?? body.message ?? 'Image upload failed');
  }

  return body.url;
};
