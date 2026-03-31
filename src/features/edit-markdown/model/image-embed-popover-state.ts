import type React from 'react';

import { normalizeEmbedInput } from '@/features/edit-markdown/model/embed-popover-state';
import { normalizeImageUrl } from '@/shared/lib/url/normalize-image-url';

export type ImageInputRow = {
  alt: string;
  id: string;
  url: string;
};

export type FilledImageRow = {
  altText: string;
  id: string;
  url: string;
};

export const MAX_IMAGE_EMBED_ITEMS = 10;
export const ACCEPTED_IMAGE_FILE_TYPES =
  '.jpeg,.jpg,.png,.gif,.heic,image/jpeg,image/png,image/gif,image/heic,image/heif';
export const ACCEPTED_IMAGE_FORMAT_LABEL = 'JPEG, JPG, PNG, GIF, HEIC';

/**
 * 이미지 입력 row 식별자를 안정적으로 생성합니다.
 *
 * @param nextId 증가 카운터 ref입니다.
 * @returns 새 입력 row를 반환합니다.
 */
export const createImageRow = (nextId: React.MutableRefObject<number>): ImageInputRow => {
  nextId.current += 1;

  return {
    alt: '',
    id: `image-row-${nextId.current}`,
    url: '',
  };
};

/**
 * URL이 채워진 row만 삽입용 목록으로 정리합니다.
 *
 * @param rows 사용자가 입력 중인 row 목록입니다.
 * @returns 유효 URL/alt 목록을 반환합니다.
 */
export const getFilledImageRows = (rows: ImageInputRow[]): FilledImageRow[] =>
  rows.flatMap(row => {
    const normalizedUrl = normalizeEmbedInput(row.url);

    if (!normalizedUrl) return [];

    return [
      {
        altText: normalizeEmbedInput(row.alt) ?? '이미지 설명',
        id: row.id,
        url: normalizedUrl,
      },
    ];
  });

/**
 * URL 기준 중복 row id 목록을 계산합니다.
 *
 * @param rows 사용자가 입력 중인 row 목록입니다.
 * @returns 중복 URL을 가진 row id 집합을 반환합니다.
 */
export const getDuplicateRowIds = (rows: ImageInputRow[]) => {
  const seenUrls = new Map<string, string>();
  const duplicateIds = new Set<string>();

  getFilledImageRows(rows).forEach(row => {
    const firstRowId = seenUrls.get(row.url);

    if (firstRowId) {
      duplicateIds.add(firstRowId);
      duplicateIds.add(row.id);
      return;
    }

    seenUrls.set(row.url, row.id);
  });

  return duplicateIds;
};

/**
 * 업로드된 row를 기존 입력 행에 병합합니다.
 * 비어 있는 행부터 채우고, 남는 항목만 뒤에 추가합니다.
 *
 * @param currentRows 현재 입력 행 목록입니다.
 * @param nextRows 새로 업로드된 row 목록입니다.
 * @returns 병합된 row 목록을 반환합니다.
 */
export const mergeImageRows = (currentRows: ImageInputRow[], nextRows: ImageInputRow[]) => {
  const mergedRows = [...currentRows];
  let uploadCursor = 0;

  for (let index = 0; index < mergedRows.length && uploadCursor < nextRows.length; index += 1) {
    if (normalizeEmbedInput(mergedRows[index]?.url)) continue;

    mergedRows[index] = nextRows[uploadCursor];
    uploadCursor += 1;
  }

  return [...mergedRows, ...nextRows.slice(uploadCursor)];
};

/**
 * 지정한 row를 위나 아래로 한 칸 이동합니다.
 *
 * @param rows 현재 입력 행 목록입니다.
 * @param rowId 이동할 row id입니다.
 * @param direction 이동 방향입니다.
 * @returns 정렬된 row 목록을 반환합니다.
 */
export const reorderRows = (rows: ImageInputRow[], rowId: string, direction: 'down' | 'up') => {
  const currentIndex = rows.findIndex(row => row.id === rowId);

  if (currentIndex < 0) return rows;

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= rows.length) {
    return rows;
  }

  const nextRows = [...rows];
  const [targetRow] = nextRows.splice(currentIndex, 1);

  nextRows.splice(nextIndex, 0, targetRow);

  return nextRows;
};

/**
 * next/image에 전달 가능한 미리보기 src만 정리합니다.
 *
 * @param value 선택된 row의 URL 문자열입니다.
 * @returns 미리보기에 사용할 수 있는 URL 또는 null을 반환합니다.
 */
export const resolvePreviewImageSrc = (value: string) => {
  const normalizedValue = normalizeEmbedInput(value);

  if (!normalizedValue) return null;

  const normalizedPreviewUrl = normalizeImageUrl(normalizedValue);

  if (!normalizedPreviewUrl?.startsWith('https://')) {
    return null;
  }

  return normalizedPreviewUrl;
};
