import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

/**
 * 공통 댓글/방명록 작성 폼이 제출하는 값 타입입니다.
 */
export type CommentComposeValues = {
  authorName: string;
  password: string;
  authorBlogUrl: string;
  isSecret: boolean;
  content: string;
};

const WHITESPACE_PATTERN = /\s+/g;
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

/**
 * 작성 폼 비밀번호에서 공백을 제거한 값을 반환합니다.
 */
export const normalizeCommentComposePassword = (password: string) =>
  password.replace(WHITESPACE_PATTERN, '');

/**
 * 작성자 이름이 최소 한 글자 이상인지 확인합니다.
 */
export const isValidCommentComposeAuthorName = (authorName: string) =>
  authorName.trim().length >= 1;

/**
 * 비밀번호에 이모지가 포함되어 있는지 확인합니다.
 */
export const hasEmojiInCommentComposePassword = (password: string) => EMOJI_PATTERN.test(password);

/**
 * 공백 제거 후 비밀번호 길이가 최소 4자인지 확인합니다.
 */
export const hasMinCommentComposePasswordLength = (password: string) =>
  normalizeCommentComposePassword(password).length >= 4;

/**
 * 작성자 블로그 URL이 비어 있거나 `http/https` URL인지 확인합니다.
 */
export const isValidCommentComposeAuthorBlogUrl = (authorBlogUrl: string) => {
  const trimmed = authorBlogUrl.trim();
  if (!trimmed) return true;

  return Boolean(normalizeHttpUrl(trimmed));
};
