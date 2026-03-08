import {
  hasEmojiInCommentComposePassword,
  hasMinCommentComposePasswordLength,
  isValidCommentComposeAuthorBlogUrl,
  isValidCommentComposeAuthorName,
  normalizeCommentComposePassword,
} from '@/shared/lib/comment-compose';

describe('comment compose validation', () => {
  it('비밀번호에서 공백을 제거한다', () => {
    expect(normalizeCommentComposePassword(' 12 34 ')).toBe('1234');
  });

  it('작성자 이름 최소 길이를 검증한다', () => {
    expect(isValidCommentComposeAuthorName('chaen')).toBe(true);
    expect(isValidCommentComposeAuthorName('   ')).toBe(false);
  });

  it('공백 제거 기준으로 비밀번호 최소 길이를 검증한다', () => {
    expect(hasMinCommentComposePasswordLength('12 34')).toBe(true);
    expect(hasMinCommentComposePasswordLength('1 2')).toBe(false);
  });

  it('비밀번호 내 이모지 포함 여부를 감지한다', () => {
    expect(hasEmojiInCommentComposePassword('abcd')).toBe(false);
    expect(hasEmojiInCommentComposePassword('ab😀cd')).toBe(true);
  });

  it('작성자 블로그 URL은 비어 있거나 http/https만 허용한다', () => {
    expect(isValidCommentComposeAuthorBlogUrl('')).toBe(true);
    expect(isValidCommentComposeAuthorBlogUrl('https://example.com')).toBe(true);
    expect(isValidCommentComposeAuthorBlogUrl('http://example.com')).toBe(true);
    expect(isValidCommentComposeAuthorBlogUrl('javascript:alert(1)')).toBe(false);
    expect(isValidCommentComposeAuthorBlogUrl('not-a-url')).toBe(false);
  });
});
