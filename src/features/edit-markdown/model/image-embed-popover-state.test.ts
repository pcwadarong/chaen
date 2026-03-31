// @vitest-environment node

import {
  getDuplicateRowIds,
  getFilledImageRows,
  mergeImageRows,
  reorderRows,
  resolvePreviewImageSrc,
} from '@/features/edit-markdown/model/image-embed-popover-state';

describe('image-embed-popover-state', () => {
  it('URL이 유효할 때, getFilledImageRows는 삽입 가능한 이미지 목록만 반환해야 한다', () => {
    expect(
      getFilledImageRows([
        { alt: '첫 번째', id: 'row-1', url: 'https://example.com/one.png' },
        { alt: '', id: 'row-2', url: '   ' },
      ]),
    ).toEqual([{ altText: '첫 번째', id: 'row-1', url: 'https://example.com/one.png' }]);
  });

  it('중복 URL이 존재할 때, getDuplicateRowIds는 중복된 두 row id를 모두 반환해야 한다', () => {
    expect(
      Array.from(
        getDuplicateRowIds([
          { alt: '', id: 'row-1', url: 'https://example.com/dup.png' },
          { alt: '', id: 'row-2', url: 'https://example.com/dup.png' },
          { alt: '', id: 'row-3', url: 'https://example.com/other.png' },
        ]),
      ),
    ).toEqual(['row-1', 'row-2']);
  });

  it('비어 있는 기존 row가 있을 때, mergeImageRows는 새 업로드 row를 앞쪽 빈 자리부터 채워야 한다', () => {
    expect(
      mergeImageRows(
        [
          { alt: '', id: 'row-1', url: '' },
          { alt: '', id: 'row-2', url: 'https://example.com/existing.png' },
        ],
        [{ alt: '업로드', id: 'row-3', url: 'https://example.com/uploaded.png' }],
      ),
    ).toEqual([
      { alt: '업로드', id: 'row-3', url: 'https://example.com/uploaded.png' },
      { alt: '', id: 'row-2', url: 'https://example.com/existing.png' },
    ]);
  });

  it('이동 가능한 row를 지정할 때, reorderRows는 해당 row를 한 칸 위로 이동해야 한다', () => {
    expect(
      reorderRows(
        [
          { alt: '', id: 'row-1', url: 'https://example.com/one.png' },
          { alt: '', id: 'row-2', url: 'https://example.com/two.png' },
        ],
        'row-2',
        'up',
      ).map(row => row.id),
    ).toEqual(['row-2', 'row-1']);
  });

  it('https 이미지 URL이 주어질 때, resolvePreviewImageSrc는 같은 URL을 미리보기용으로 반환해야 한다', () => {
    expect(resolvePreviewImageSrc('https://example.com/preview.png')).toBe(
      'https://example.com/preview.png',
    );
  });

  it('https가 아닌 URL이 주어질 때, resolvePreviewImageSrc는 null을 반환해야 한다', () => {
    expect(resolvePreviewImageSrc('/relative/path.png')).toBeNull();
  });
});
