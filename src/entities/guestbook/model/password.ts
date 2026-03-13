import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import 'server-only';

const SCRYPT_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_OPTIONS = {
  N: 2 ** 14,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
} as const;

/**
 * 평문 비밀번호를 검증 가능한 해시 문자열로 변환합니다.
 * 반환 포맷: `{saltHex}:{derivedKeyHex}`
 */
export const hashGuestbookPassword = (plainText: string): string => {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = scryptSync(plainText, salt, SCRYPT_LENGTH, SCRYPT_OPTIONS).toString('hex');

  return `${salt}:${derivedKey}`;
};

/**
 * 저장된 해시와 입력 비밀번호가 일치하는지 확인합니다.
 */
export const verifyGuestbookPassword = (plainText: string, storedHash: string | null): boolean => {
  if (!storedHash) return plainText.length === 0;

  const [salt, storedKeyHex] = storedHash.split(':');
  if (!salt || !storedKeyHex) return false;

  const suppliedKey = scryptSync(plainText, salt, SCRYPT_LENGTH, SCRYPT_OPTIONS);
  const storedKey = Buffer.from(storedKeyHex, 'hex');
  if (suppliedKey.byteLength !== storedKey.byteLength) return false;

  return timingSafeEqual(suppliedKey, storedKey);
};
