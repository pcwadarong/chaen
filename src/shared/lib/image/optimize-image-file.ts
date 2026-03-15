'use client';

const OUTPUT_TYPE = 'image/webp';
const OPTIMIZABLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * 원본 비율을 유지한 채 지정한 최대 크기 안으로 축소합니다.
 */
export const resolveImageOptimizationDimensions = ({
  height,
  maxHeight,
  maxWidth,
  width,
}: {
  height: number;
  maxHeight: number;
  maxWidth: number;
  width: number;
}) => {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
};

/**
 * 최적화된 결과 파일명을 webp 확장자로 정리합니다.
 */
const resolveOptimizedImageFileName = (fileName: string) =>
  fileName.replace(/\.[^./]+$/, '') + '.webp';

/**
 * File에서 이미지를 읽어 natural size를 확인할 수 있는 HTMLImageElement를 생성합니다.
 */
const loadImageElement = (file: File, errorLabel: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`[${errorLabel}] 이미지 디코딩에 실패했습니다.`));
    };

    image.src = objectUrl;
  });

/**
 * Canvas 결과를 webp Blob으로 변환합니다.
 */
const convertCanvasToBlob = ({
  canvas,
  errorLabel,
  outputQuality,
}: {
  canvas: HTMLCanvasElement;
  errorLabel: string;
  outputQuality: number;
}) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error(`[${errorLabel}] canvas blob 변환에 실패했습니다.`));
          return;
        }

        resolve(blob);
      },
      OUTPUT_TYPE,
      outputQuality,
    );
  });

/**
 * 이미지 용도별 최대 크기에 맞춰 webp로 축소·압축합니다.
 */
export const optimizeImageFile = async ({
  errorLabel,
  file,
  maxHeight,
  maxWidth,
  outputQuality,
}: {
  errorLabel: string;
  file: File;
  maxHeight: number;
  maxWidth: number;
  outputQuality: number;
}) => {
  if (!OPTIMIZABLE_IMAGE_TYPES.has(file.type)) {
    return file;
  }

  const image = await loadImageElement(file, errorLabel);
  const { height, width } = resolveImageOptimizationDimensions({
    height: image.naturalHeight,
    maxHeight,
    maxWidth,
    width: image.naturalWidth,
  });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error(`[${errorLabel}] canvas context를 생성하지 못했습니다.`);
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const optimizedBlob = await convertCanvasToBlob({
    canvas,
    errorLabel,
    outputQuality,
  });

  if (optimizedBlob.size >= file.size) {
    return file;
  }

  return new File([optimizedBlob], resolveOptimizedImageFileName(file.name), {
    lastModified: file.lastModified,
    type: OUTPUT_TYPE,
  });
};
