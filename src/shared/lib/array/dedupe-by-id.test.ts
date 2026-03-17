import { dedupeById } from '@/shared/lib/array/dedupe-by-id';

describe('dedupeById', () => {
  it('중복 id를 제거하고 첫 항목 순서를 유지한다', () => {
    const result = dedupeById([
      { id: 'a', label: 'first-a' },
      { id: 'b', label: 'first-b' },
      { id: 'a', label: 'second-a' },
      { id: 'c', label: 'first-c' },
      { id: 'b', label: 'second-b' },
    ]);

    expect(result).toEqual([
      { id: 'a', label: 'first-a' },
      { id: 'b', label: 'first-b' },
      { id: 'c', label: 'first-c' },
    ]);
  });
});
