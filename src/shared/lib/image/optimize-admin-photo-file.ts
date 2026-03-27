'use client';

const ADMIN_PHOTO_MAX_WIDTH = 2400;
const ADMIN_PHOTO_MAX_HEIGHT = 2400;
const ADMIN_PHOTO_MAX_FILE_SIZE = 5 * 1024 * 1024;
const ADMIN_PHOTO_JPEG_QUALITY = 0.88;
const OPTIMIZABLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

/**
 * 관리자 사진 업로드용으로 원본 비율을 유지한 축소 크기를 계산합니다.
 */
const resolveAdminPhotoOptimizationDimensions = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  const scale = Math.min(1, ADMIN_PHOTO_MAX_WIDTH / width, ADMIN_PHOTO_MAX_HEIGHT / height);

  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
};

/**
 * 파일을 `Image`로 디코딩해 실제 해상도를 읽어옵니다.
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
      reject(new Error('[admin-photo-optimization] 이미지 디코딩에 실패했습니다.'));
    };

    image.src = objectUrl;
  });

/**
 * Canvas에 그린 이미지를 원본 포맷 기준 Blob으로 변환합니다.
 */
const convertCanvasToBlob = ({
  canvas,
  fileType,
}: {
  canvas: HTMLCanvasElement;
  fileType: string;
}) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('[admin-photo-optimization] canvas blob 변환에 실패했습니다.'));
          return;
        }

        resolve(blob);
      },
      fileType,
      fileType === 'image/jpeg' ? ADMIN_PHOTO_JPEG_QUALITY : undefined,
    );
  });

/**
 * 큰 JPEG/PNG만 해상도를 줄여 원본 포맷 그대로 압축합니다.
 * HEIC/HEIF는 브라우저 호환성을 고려해 원본 업로드를 유지합니다.
 */
export const optimizeAdminPhotoFile = async (file: File) => {
  if (!OPTIMIZABLE_IMAGE_TYPES.has(file.type)) {
    return file;
  }

  const image = await loadImageElement(file);
  const isOversized =
    image.naturalWidth > ADMIN_PHOTO_MAX_WIDTH ||
    image.naturalHeight > ADMIN_PHOTO_MAX_HEIGHT ||
    file.size > ADMIN_PHOTO_MAX_FILE_SIZE;

  if (!isOversized) {
    return file;
  }

  const { height, width } = resolveAdminPhotoOptimizationDimensions({
    height: image.naturalHeight,
    width: image.naturalWidth,
  });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('[admin-photo-optimization] canvas context를 생성하지 못했습니다.');
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const optimizedBlob = await convertCanvasToBlob({
    canvas,
    fileType: file.type,
  });

  if (optimizedBlob.size >= file.size) {
    return file;
  }

  return new File([optimizedBlob], file.name, {
    lastModified: file.lastModified,
    type: file.type,
  });
};
