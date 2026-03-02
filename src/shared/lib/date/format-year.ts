/**
 * 날짜 문자열을 locale별 연도 텍스트(예: `2026`)로 변환합니다.
 */
export const formatYear = (dateText: string | null | undefined, locale: string): string | null => {
  if (!dateText) return null;

  const timestamp = Date.parse(dateText);
  if (Number.isNaN(timestamp)) return null;

  return new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(new Date(timestamp));
};
