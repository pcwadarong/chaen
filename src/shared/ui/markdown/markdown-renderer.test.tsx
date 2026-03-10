import { render, screen } from '@testing-library/react';
import { renderToReadableStream } from 'react-dom/server';

import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';

/**
 * 서버 컴포넌트 결과를 HTML 문자열로 수집합니다.
 */
const renderServerHtml = async (markdown: string) => {
  const element = await MarkdownRenderer({ markdown });
  const stream = await renderToReadableStream(element);

  return new Response(stream).text();
};

/**
 * 서버 렌더링 결과를 DOM으로 파싱합니다.
 */
const renderServerDocument = async (markdown: string) => {
  const html = await renderServerHtml(markdown);

  return new DOMParser().parseFromString(html, 'text/html');
};

describe('MarkdownRenderer', () => {
  it('GFM과 코드 블럭 스타일을 포함한 markdown를 렌더링한다', async () => {
    const markdown = [
      '# 제목',
      '',
      '> 인용문',
      '',
      '[외부 링크](https://example.com)',
      '',
      '| 이름 | 설명 |',
      '| --- | --- |',
      '| Markdown | Renderer |',
      '',
      '```ts',
      "const answer = '42';",
      '```',
    ].join('\n');
    const html = await renderServerHtml(markdown);
    const document = await renderServerDocument(markdown);
    const highlightedPre = document.querySelector('pre[data-language="ts"]');
    const markdownTable = document.querySelector('div[aria-label="Markdown table"]');

    expect(highlightedPre).toBeTruthy();
    expect(highlightedPre?.className).toBeTruthy();
    expect(highlightedPre?.getAttribute('tabindex')).toBe('0');
    expect(highlightedPre?.getAttribute('aria-label')).toBe('Code block: ts');
    expect(highlightedPre?.textContent).toContain("const answer = '42';");
    expect(markdownTable).toBeTruthy();
    expect(markdownTable?.getAttribute('tabindex')).toBe('0');

    expect(html).toContain('<h1');
    expect(html).toContain('제목</h1>');
    expect(html).toContain('<blockquote');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('<table');
  });

  it('이미지를 반응형 본문 이미지로 렌더링한다', async () => {
    const document = await renderServerDocument('![설명](https://example.com/image.png "샘플")');
    const image = document.querySelector('img');

    expect(image).toBeTruthy();
    expect(image?.getAttribute('src')).toBe('https://example.com/image.png');
    expect(image?.getAttribute('alt')).toBe('설명');
    expect(image?.className).toBeTruthy();
  });

  it('본문이 비어 있으면 대체 문구를 렌더링한다', async () => {
    const element = await MarkdownRenderer({
      emptyText: '본문이 없습니다.',
      markdown: null,
    });

    render(element);

    expect(screen.getByText('본문이 없습니다.')).toBeTruthy();
  });
});
