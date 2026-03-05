import { hashGuestbookPassword, verifyGuestbookPassword } from './password';

describe('guestbook password', () => {
  it('해시 문자열은 salt:derivedKey 포맷으로 생성된다', () => {
    const hashed = hashGuestbookPassword('secret-1234');
    const [saltHex, keyHex] = hashed.split(':');

    expect(saltHex).toMatch(/^[a-f0-9]{32}$/);
    expect(keyHex).toMatch(/^[a-f0-9]{128}$/);
  });

  it('동일 비밀번호는 검증에 성공한다', () => {
    const plainText = 'guestbook-password';
    const hashed = hashGuestbookPassword(plainText);

    expect(verifyGuestbookPassword(plainText, hashed)).toBe(true);
    expect(verifyGuestbookPassword('wrong-password', hashed)).toBe(false);
  });

  it('저장 해시가 비어있으면 빈 문자열만 유효하다', () => {
    expect(verifyGuestbookPassword('', null)).toBe(true);
    expect(verifyGuestbookPassword('non-empty', null)).toBe(false);
  });

  it('잘못된 포맷의 해시는 검증에 실패한다', () => {
    expect(verifyGuestbookPassword('secret', 'invalid-format')).toBe(false);
    expect(verifyGuestbookPassword('secret', 'a:b')).toBe(false);
  });
});
