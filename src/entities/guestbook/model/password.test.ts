import { hashGuestbookPassword, verifyGuestbookPassword } from './password';

describe('password', () => {
  it('비밀번호를 해시하고 다시 검증할 수 있다', () => {
    const hashed = hashGuestbookPassword('secret');

    expect(verifyGuestbookPassword('secret', hashed)).toBe(true);
    expect(verifyGuestbookPassword('wrong', hashed)).toBe(false);
  });

  it('저장된 해시가 없으면 빈 문자열만 통과시킨다', () => {
    expect(verifyGuestbookPassword('', null)).toBe(true);
    expect(verifyGuestbookPassword('secret', null)).toBe(false);
  });
});
