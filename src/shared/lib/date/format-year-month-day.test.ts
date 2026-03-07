import { formatYearMonthDay } from './format-year-month-day';

describe('formatYearMonthDay', () => {
  it('날짜를 YYYY-MM-DD 형식으로 변환한다', () => {
    expect(formatYearMonthDay('2026-02-24T09:00:00+00:00')).toBe('2026-02-24');
  });

  it('잘못된 값이면 null을 반환한다', () => {
    expect(formatYearMonthDay('invalid-date')).toBeNull();
    expect(formatYearMonthDay(null)).toBeNull();
  });
});
