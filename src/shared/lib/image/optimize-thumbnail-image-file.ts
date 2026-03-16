'use client';

import {
  optimizeImageFile,
  resolveImageOptimizationDimensions,
} from '@/shared/lib/image/optimize-image-file';

const THUMBNAIL_MAX_WIDTH = 800;
const THUMBNAIL_MAX_HEIGHT = 800;
const THUMBNAIL_OUTPUT_QUALITY = 0.82;

/**
 * 원본 비율을 유지한 채 썸네일 최대 크기 안으로 축소합니다.
 */
export const resolveThumbnailOptimizationDimensions = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) =>
  resolveImageOptimizationDimensions({
    height,
    maxHeight: THUMBNAIL_MAX_HEIGHT,
    maxWidth: THUMBNAIL_MAX_WIDTH,
    width,
  });

/**
 * article/project 썸네일 전용으로 이미지를 축소·압축합니다.
 * 일반 본문 이미지 업로드 경로와 분리해, 썸네일만 작은 webp로 저장합니다.
 */
export const optimizeThumbnailImageFile = (file: File) =>
  optimizeImageFile({
    errorLabel: 'thumbnail-optimization',
    file,
    maxHeight: THUMBNAIL_MAX_HEIGHT,
    maxWidth: THUMBNAIL_MAX_WIDTH,
    outputQuality: THUMBNAIL_OUTPUT_QUALITY,
  });
