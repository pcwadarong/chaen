import { formatProjectPeriod } from '@/shared/lib/date/format-project-period';

describe('formatProjectPeriod', () => {
  it('period_start가 없고 period_end도 없으면 created_at 기준으로 진행 중 라벨을 붙인다', () => {
    const result = formatProjectPeriod(
      {
        created_at: '2026-03-01T00:00:00.000Z',
        period_end: null,
        period_start: null,
      },
      'ko',
      '진행 중',
    );

    expect(result).toBe('2026년 3월 - 진행 중');
  });
});
