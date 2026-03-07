import { render, screen } from '@testing-library/react';
import { renderToReadableStream } from 'react-dom/server';

import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';
import styles from '@/shared/ui/markdown/markdown-renderer.module.css';

/**
 * 서버 컴포넌트 결과를 HTML 문자열로 수집합니다.
 */
const renderServerHtml = async (markdown: string) => {
  const element = await MarkdownRenderer({ markdown });
  const stream = await renderToReadableStream(element);

  return new Response(stream).text();
};

describe('MarkdownRenderer', () => {
  it('GFM과 코드 블럭 스타일을 포함한 markdown를 렌더링한다', async () => {
    const html = await renderServerHtml(
      [
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
      ].join('\n'),
    );

    expect(html).toContain('<h1');
    expect(html).toContain('제목</h1>');
    expect(html).toContain('<blockquote');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('<table');
    expect(html).toContain('>ts<');
    expect(html).toContain('>const<');
    expect(html).toContain('> answer<');
    expect(html).toContain('&#x27;42&#x27;');
    expect(html).not.toContain(`class="${styles.inlineCode}" data-language="ts"`);
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
