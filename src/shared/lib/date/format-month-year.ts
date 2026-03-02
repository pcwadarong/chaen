/**
 * 날짜 문자열을 locale별 `YYYY Month` 형태(예: `2026년 2월`, `February 2026`)로 변환합니다.
 */
export const formatMonthYear = (
  dateText: string | null | undefined,
  locale: string,
): string | null => {
  if (!dateText) return null;

  const timestamp = Date.parse(dateText);
  if (Number.isNaN(timestamp)) return null;

  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(timestamp),
  );
};
