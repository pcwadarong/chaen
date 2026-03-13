type PublishedContentCursor = {
  id: string;
  publishedAt: string;
};

/**
 * referenced table에 적용할 공개 콘텐츠 필터 문자열을 생성합니다.
 *
 * Supabase/PostgREST의 `or(..., { referencedTable })` 문법은 하나의 논리식만 받을 수 있어서
 * publish 상태와 keyset cursor 조건을 함께 만족하도록 한 번에 조합합니다.
 */
export const buildReferencedPublicContentFilter = ({
  cursor,
  nowIsoString,
}: {
  cursor?: PublishedContentCursor | null;
  nowIsoString: string;
}) => {
  const publishWindowCondition = `publish_at.lte.${nowIsoString}`;

  if (!cursor) {
    return publishWindowCondition;
  }

  return [
    `and(${publishWindowCondition},publish_at.lt.${cursor.publishedAt})`,
    `and(${publishWindowCondition},publish_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`,
  ].join(',');
};
