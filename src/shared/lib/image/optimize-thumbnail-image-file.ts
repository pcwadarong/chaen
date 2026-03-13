'use client';

const THUMBNAIL_MAX_WIDTH = 800;
const THUMBNAIL_MAX_HEIGHT = 800;
const THUMBNAIL_OUTPUT_TYPE = 'image/webp';
const THUMBNAIL_OUTPUT_QUALITY = 0.82;
const OPTIMIZABLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * 원본 비율을 유지한 채 썸네일 최대 크기 안으로 축소합니다.
 */
export const resolveThumbnailOptimizationDimensions = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / width, THUMBNAIL_MAX_HEIGHT / height);

  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
};

/**
 * 썸네일 압축 결과 파일명을 webp 확장자로 정리합니다.
 */
const resolveOptimizedThumbnailFileName = (fileName: string) =>
  fileName.replace(/\.[^./]+$/, '') + '.webp';

/**
 * File에서 이미지를 읽어 natural size를 확인할 수 있는 HTMLImageElement를 생성합니다.
 */
const loadImageElement = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('[thumbnail-optimization] 이미지 디코딩에 실패했습니다.'));
    };

    image.src = objectUrl;
  });

/**
 * Canvas 결과를 webp Blob으로 변환합니다.
 */
const convertCanvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('[thumbnail-optimization] canvas blob 변환에 실패했습니다.'));
          return;
        }

        resolve(blob);
      },
      THUMBNAIL_OUTPUT_TYPE,
      THUMBNAIL_OUTPUT_QUALITY,
    );
  });

/**
 * article/project 썸네일 전용으로 이미지를 축소·압축합니다.
 * 일반 본문 이미지 업로드 경로와 분리해, 썸네일만 작은 webp로 저장합니다.
 */
export const optimizeThumbnailImageFile = async (file: File) => {
  if (!OPTIMIZABLE_IMAGE_TYPES.has(file.type)) {
    return file;
  }

  const image = await loadImageElement(file);
  const { height, width } = resolveThumbnailOptimizationDimensions({
    height: image.naturalHeight,
    width: image.naturalWidth,
  });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('[thumbnail-optimization] canvas context를 생성하지 못했습니다.');
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const optimizedBlob = await convertCanvasToBlob(canvas);
  const isSameSize = width === image.naturalWidth && height === image.naturalHeight;

  if (isSameSize && optimizedBlob.size >= file.size) {
    return file;
  }

  return new File([optimizedBlob], resolveOptimizedThumbnailFileName(file.name), {
    lastModified: file.lastModified,
    type: THUMBNAIL_OUTPUT_TYPE,
  });
};
