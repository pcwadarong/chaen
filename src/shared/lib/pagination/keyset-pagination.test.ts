import {
  buildCreatedAtIdPage,
  parseCreatedAtIdCursor,
  parseKeysetLimit,
  parseLocaleAwareCreatedAtIdCursor,
  serializeCreatedAtIdCursor,
  serializeLocaleAwareCreatedAtIdCursor,
} from '@/shared/lib/pagination/keyset-pagination';

describe('keyset pagination', () => {
  it('created_at + id cursor를 직렬화하고 복원한다', () => {
    const cursor = serializeCreatedAtIdCursor({
      createdAt: '2026-03-02T09:07:50.797695+00:00',
      id: 'project-1',
    });

    expect(parseCreatedAtIdCursor(cursor)).toEqual({
      createdAt: '2026-03-02T09:07:50.797695+00:00',
      id: 'project-1',
    });
  });

  it('유효하지 않은 cursor는 null로 정규화한다', () => {
    expect(parseCreatedAtIdCursor(undefined)).toBeNull();
    expect(parseCreatedAtIdCursor('invalid')).toBeNull();
  });

  it('created_at + id + locale cursor를 직렬화하고 복원한다', () => {
    const cursor = serializeLocaleAwareCreatedAtIdCursor({
      createdAt: '2026-03-02T09:07:50.797695+00:00',
      id: 'article-1',
      locale: 'ko',
    });

    expect(parseLocaleAwareCreatedAtIdCursor(cursor)).toEqual({
      createdAt: '2026-03-02T09:07:50.797695+00:00',
      id: 'article-1',
      locale: 'ko',
    });
  });

  it('limit + 1개 결과에서 다음 cursor를 계산한다', () => {
    const result = buildCreatedAtIdPage({
      limit: 2,
      rows: [
        { createdAt: '2026-03-03T00:00:00.000Z', id: 'a' },
        { createdAt: '2026-03-02T00:00:00.000Z', id: 'b' },
        { createdAt: '2026-03-01T00:00:00.000Z', id: 'c' },
      ],
    });

    expect(result.items).toEqual([
      { createdAt: '2026-03-03T00:00:00.000Z', id: 'a' },
      { createdAt: '2026-03-02T00:00:00.000Z', id: 'b' },
    ]);
    expect(parseCreatedAtIdCursor(result.nextCursor)).toEqual({
      createdAt: '2026-03-02T00:00:00.000Z',
      id: 'b',
    });
  });

  it('limit은 기존 페이지네이션 규칙과 같은 범위로 정규화한다', () => {
    expect(parseKeysetLimit(undefined)).toBe(10);
    expect(parseKeysetLimit(0)).toBe(10);
    expect(parseKeysetLimit(99)).toBe(30);
  });
});
