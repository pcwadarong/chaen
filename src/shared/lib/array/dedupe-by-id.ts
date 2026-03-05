/**
 * 배열에서 같은 id가 중복된 항목이 있으면 첫 번째 항목만 유지합니다.
 *
 * 입력 배열의 순서를 그대로 보존하며, 일반적으로 사전 정렬된 데이터를
 * 안정적으로 정제할 때 사용합니다.
 */
export const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;

    seen.add(item.id);
    deduped.push(item);
  }

  return deduped;
};
