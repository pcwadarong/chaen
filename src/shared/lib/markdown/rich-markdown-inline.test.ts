/** @vitest-environment node */

import {
  normalizeMarkdownHtmlAliases,
  preprocessMarkdownInlineSyntax,
} from '@/shared/lib/markdown/rich-markdown-inline';

describe('rich-markdown inline utils', () => {
  it('Under a br alias followed by Enter, normalizeMarkdownHtmlAliases must preserve both the hard break and the following line separation', () => {
    expect(normalizeMarkdownHtmlAliases(['첫 번째 줄<br/>', '두 번째 줄'].join('\n'))).toBe(
      '첫 번째 줄  \n\n두 번째 줄',
    );
  });

  it('Under inline math syntax outside code fences, preprocessMarkdownInlineSyntax must convert the math tag into a markdown inline directive link', () => {
    expect(preprocessMarkdownInlineSyntax('합은 <Math>a^2 + b^2</Math> 입니다')).toBe(
      '합은 [a^2 + b^2](#md-math:a%5E2%20%2B%20b%5E2) 입니다',
    );
  });

  it('Under fenced code blocks, preprocessMarkdownInlineSyntax must leave custom inline syntax untouched', () => {
    expect(
      preprocessMarkdownInlineSyntax(
        ['```ts', 'const raw = "<Math>a^2</Math>";', '```'].join('\n'),
      ),
    ).toBe(['```ts', 'const raw = "<Math>a^2</Math>";', '```'].join('\n'));
  });
});
