import { buildOffsetPage, parseOffsetCursor, parseOffsetLimit } from './offset-pagination';

describe('offset-pagination', () => {
  it('유효하지 않은 cursor는 0으로 정규화한다', () => {
    expect(parseOffsetCursor(undefined)).toBe(0);
    expect(parseOffsetCursor('invalid')).toBe(0);
    expect(parseOffsetCursor('-1')).toBe(0);
  });

  it('limit을 기본값/최대값 범위로 정규화한다', () => {
    expect(parseOffsetLimit(undefined)).toBe(12);
    expect(parseOffsetLimit(0)).toBe(12);
    expect(parseOffsetLimit(99)).toBe(30);
    expect(parseOffsetLimit(5)).toBe(5);
  });

  it('items/cursor/limit으로 페이지와 nextCursor를 계산한다', () => {
    const result = buildOffsetPage({
      items: ['a', 'b', 'c'],
      cursor: '1',
      limit: 1,
    });

    expect(result.items).toEqual(['b']);
    expect(result.nextCursor).toBe('2');
  });
});
