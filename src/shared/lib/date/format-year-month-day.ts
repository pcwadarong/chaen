/**
 * 날짜 문자열을 `YYYY. MM. DD` 형식으로 변환합니다.
 */
export const formatYearMonthDay = (dateText: string | null | undefined): string | null => {
  if (!dateText) return null;

  const timestamp = Date.parse(dateText);
  if (Number.isNaN(timestamp)) return null;

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}. ${month}. ${day}`;
};
