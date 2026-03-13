type PublicContentIdentity = {
  id: string;
  slug?: string | null;
};

type PublicContentPublication = {
  publish_at?: string | null;
};

/**
 * 공개 콘텐츠의 주소 경로에 사용할 식별자를 반환합니다.
 *
 * 공개 콘텐츠 경로는 slug만 허용합니다.
 *
 * @param content - 주소 경로를 만들 콘텐츠 식별자 정보
 * @returns 공개 경로에 사용할 slug
 */
export const resolvePublicContentPathSegment = ({ id, slug }: PublicContentIdentity): string =>
  slug?.trim() ||
  (() => {
    throw new Error(`[content] 공개 경로용 slug가 없습니다. id=${id}`);
  })();

/**
 * 공개 콘텐츠의 실질 게시 시점을 반환합니다.
 *
 * public 목록과 상세 화면은 publish_at만 사용합니다.
 *
 * @param content - 게시 시점을 포함한 공개 콘텐츠 요약 정보
 * @returns 공개 콘텐츠의 게시 시점
 */
export const resolvePublicContentPublishedAt = ({
  publish_at,
}: PublicContentPublication): string => {
  if (!publish_at) {
    throw new Error('[content] 공개 콘텐츠 publish_at이 없습니다.');
  }

  return publish_at;
};
