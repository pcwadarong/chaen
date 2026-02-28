import enMessages from './en.json';
import frMessages from './fr.json';
import jaMessages from './ja.json';
import koMessages from './ko.json';

interface MessageTree {
  [key: string]: MessageTree | string;
}

/**
 * 중첩된 메시지 객체를 점 표기 키 목록으로 펼칩니다.
 */
const flattenMessageKeys = (tree: MessageTree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    return typeof value === 'string' ? [nextKey] : flattenMessageKeys(value, nextKey);
  });

describe('messages', () => {
  const baseKeys = flattenMessageKeys(koMessages as MessageTree).sort();

  it.each([
    ['en', enMessages],
    ['ja', jaMessages],
    ['fr', frMessages],
  ])('%s 메시지가 한국어 메시지와 같은 키 구조를 유지한다', (_locale, messages) => {
    expect(flattenMessageKeys(messages as MessageTree).sort()).toEqual(baseKeys);
  });
});
