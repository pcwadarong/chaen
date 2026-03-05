import { getErrorMessage } from './get-error-message';

describe('getErrorMessage', () => {
  it('Error 객체면 message를 반환한다', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('Error 객체가 아니면 fallback을 반환한다', () => {
    expect(getErrorMessage({})).toBe('unknown error');
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
  });
});
