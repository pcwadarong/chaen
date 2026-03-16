'use client';

import {
  optimizeImageFile,
  resolveImageOptimizationDimensions,
} from '@/shared/lib/image/optimize-image-file';

const CONTENT_MAX_WIDTH = 1600;
const CONTENT_MAX_HEIGHT = 1600;
const CONTENT_OUTPUT_QUALITY = 0.84;

/**
 * 원본 비율을 유지한 채 본문 이미지 최대 크기 안으로 축소합니다.
 */
export const resolveContentOptimizationDimensions = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) =>
  resolveImageOptimizationDimensions({
    height,
    maxHeight: CONTENT_MAX_HEIGHT,
    maxWidth: CONTENT_MAX_WIDTH,
    width,
  });

/**
 * article/project 본문 이미지 전용으로 이미지를 축소·압축합니다.
 * 본문 가독성을 위해 썸네일보다 큰 최대 크기를 허용합니다.
 */
export const optimizeContentImageFile = (file: File) =>
  optimizeImageFile({
    errorLabel: 'content-image-optimization',
    file,
    maxHeight: CONTENT_MAX_HEIGHT,
    maxWidth: CONTENT_MAX_WIDTH,
    outputQuality: CONTENT_OUTPUT_QUALITY,
  });
