/**
 * 자유 입력 문자열을 slug 규칙에 맞는 소문자 하이픈 문자열로 변환합니다.
 */
export const slugifyText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * 사용자가 직접 입력한 slug 값을 허용 문자 규칙에 맞게 정규화합니다.
 */
export const normalizeSlugInput = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
