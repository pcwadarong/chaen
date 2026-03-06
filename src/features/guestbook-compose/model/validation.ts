const WHITESPACE_PATTERN = /\s+/g;
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

/**
 * 공백을 제거한 비밀번호 값을 반환합니다.
 */
export const normalizeComposePassword = (password: string) =>
  password.replace(WHITESPACE_PATTERN, '');

/**
 * 닉네임이 유효한지 확인합니다.
 */
export const isValidComposeNickname = (nickname: string) => nickname.trim().length >= 1;

/**
 * 비밀번호에 이모지가 포함되어 있는지 확인합니다.
 */
export const hasEmojiInPassword = (password: string) => EMOJI_PATTERN.test(password);

/**
 * 공백 제거 후 비밀번호 길이가 최소 4자인지 확인합니다.
 */
export const hasMinComposePasswordLength = (password: string) =>
  normalizeComposePassword(password).length >= 4;
