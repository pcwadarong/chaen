/**
 * 날짜 문자열을 `YYYY-MM-DD` 형식으로 변환합니다.
 */
export const formatYearMonthDay = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(Date.parse(value));
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
