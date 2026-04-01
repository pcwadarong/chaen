/** @vitest-environment node */

import {
  normalizeMarkdownHtmlAliases,
  preprocessMarkdownInlineSyntax,
} from '@/entities/editor-core/model/markdown-inline';

describe('rich-markdown inline utils', () => {
  it('br alias 뒤에 Enter가 오면, normalizeMarkdownHtmlAliases는 hard break와 다음 줄 분리를 함께 유지해야 한다', () => {
    expect(normalizeMarkdownHtmlAliases(['첫 번째 줄<br/>', '두 번째 줄'].join('\n'))).toBe(
      '첫 번째 줄  \n\n두 번째 줄',
    );
  });

  it('code fence 밖의 inline math syntax가 주어지면, preprocessMarkdownInlineSyntax는 math 태그를 markdown inline directive link로 변환해야 한다', () => {
    expect(preprocessMarkdownInlineSyntax('합은 <Math>a^2 + b^2</Math> 입니다')).toBe(
      '합은 [a^2 + b^2](#md-math:a%5E2%20%2B%20b%5E2) 입니다',
    );
  });

  it('fenced code block 안에서는, preprocessMarkdownInlineSyntax는 custom inline syntax를 그대로 유지해야 한다', () => {
    expect(
      preprocessMarkdownInlineSyntax(
        ['```ts', 'const raw = "<Math>a^2</Math>";', '```'].join('\n'),
      ),
    ).toBe(['```ts', 'const raw = "<Math>a^2</Math>";', '```'].join('\n'));
  });
});
