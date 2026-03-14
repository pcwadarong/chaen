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
      '#### 작은 제목',
      '',
      '> 인용문',
      '',
      '- bullet',
      '  - nested bullet',
      '',
      '1. number',
      '   1. nested number',
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
    const unorderedList = document.querySelector('ul');
    const orderedList = document.querySelector('ol');

    expect(highlightedPre).toBeTruthy();
    expect(highlightedPre?.className).toBeTruthy();
    expect(highlightedPre?.getAttribute('tabindex')).toBe('0');
    expect(highlightedPre?.getAttribute('aria-label')).toBe('Code block: ts');
    expect(highlightedPre?.textContent).toContain("const answer = '42';");
    expect(markdownTable).toBeTruthy();
    expect(markdownTable?.getAttribute('tabindex')).toBe('0');
    expect(unorderedList).toBeTruthy();
    expect(orderedList).toBeTruthy();

    expect(html).toContain('<h1');
    expect(html).toContain('제목</h1>');
    expect(html).toContain('<h4');
    expect(html).toContain('작은 제목</h4>');
    expect(html).toContain('<blockquote');
    expect(html).toContain('nested bullet');
    expect(html).toContain('nested number');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('<table');
    expect(document.querySelector('[data-link-embed-card="true"]')).toBeNull();
  });

  it('이미지를 반응형 본문 이미지로 렌더링한다', async () => {
    const document = await renderServerDocument('![설명](https://example.com/image.png "샘플")');
    const image = document.querySelector('img');

    expect(image).toBeTruthy();
    expect(image?.getAttribute('src')).toBe('https://example.com/image.png');
    expect(image?.getAttribute('alt')).toBe('설명');
    expect(image?.className).toBeTruthy();
  });

  it('locale이 주어지면 markdown wrapper에 lang 속성을 전달한다', async () => {
    const element = await MarkdownRenderer({
      locale: 'ja',
      markdown: '일본어 본문',
    });
    const stream = await renderToReadableStream(element);
    const html = await new Response(stream).text();
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(document.querySelector('div[lang="ja"]')).toBeTruthy();
  });

  it('테이블 안 이미지도 셀 너비 안에서 줄어들도록 동일한 이미지 스타일을 적용한다', async () => {
    const document = await renderServerDocument(
      [
        '| 이미지 | 설명 |',
        '| --- | --- |',
        '| ![표 이미지](https://example.com/table-image.png) | 셀 안 이미지 |',
      ].join('\n'),
    );
    const tableImage = document.querySelector('table img');
    const markdownTable = document.querySelector('div[aria-label="Markdown table"]');

    expect(markdownTable).toBeTruthy();
    expect(tableImage).toBeTruthy();
    expect(tableImage?.className).toBeTruthy();
  });

  it('단일 줄바꿈을 br 요소로 렌더링한다', async () => {
    const document = await renderServerDocument(['첫 번째 줄', '두 번째 줄'].join('\n'));
    const paragraph = document.querySelector('p');
    const lineBreak = document.querySelector('p br');

    expect(paragraph).toBeTruthy();
    expect(lineBreak).toBeTruthy();
    expect(paragraph?.textContent).toBe('첫 번째 줄\n두 번째 줄');
  });

  it('literal br 태그는 markdown 줄바꿈으로 정규화해 렌더링한다', async () => {
    const document = await renderServerDocument('첫 번째 줄<br />두 번째 줄');
    const lineBreak = document.querySelector('p br');

    expect(lineBreak).toBeTruthy();
    expect(document.querySelector('p')?.textContent).toBe('첫 번째 줄\n두 번째 줄');
  });

  it('줄 끝의 literal <br/>도 빈 문단 없이 markdown 줄바꿈으로 정규화한다', async () => {
    const document = await renderServerDocument(['첫 번째 줄<br/>', '두 번째 줄'].join('\n'));
    const paragraphs = Array.from(document.querySelectorAll('p'));

    expect(paragraphs).toHaveLength(1);
    expect(document.querySelector('p br')).toBeTruthy();
    expect(paragraphs[0]?.textContent).toBe('첫 번째 줄\n두 번째 줄');
  });

  it('literal hr 태그는 구분선으로 정규화해 렌더링한다', async () => {
    const document = await renderServerDocument('위 문단\n\n<hr />\n\n아래 문단');

    expect(document.querySelector('hr')).toBeTruthy();
  });

  it('fenced code block 안의 custom syntax와 html alias는 일반 코드 텍스트로 유지한다', async () => {
    const markdown = [
      '```md',
      ':::toggle ## 예시 제목',
      '토글 본문',
      ':::',
      '',
      ':::align center',
      '정렬 본문',
      ':::',
      '',
      '-# 보조 문구',
      '<br />',
      '<hr />',
      '```',
    ].join('\n');
    const document = await renderServerDocument(markdown);
    const codeBlock = document.querySelector('pre code');

    expect(codeBlock?.textContent).toContain(':::toggle ## 예시 제목');
    expect(codeBlock?.textContent).toContain(':::align center');
    expect(codeBlock?.textContent).toContain('-# 보조 문구');
    expect(codeBlock?.textContent).toContain('<br />');
    expect(codeBlock?.textContent).toContain('<hr />');
    expect(document.querySelector('details')).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('언어 class가 없는 fenced code block도 block code로 유지한다', async () => {
    const document = await renderServerDocument(['```', 'plain block', '```'].join('\n'));
    const blockCode = document.querySelector('pre code');

    expect(blockCode).toBeTruthy();
    expect(blockCode?.textContent).toContain('plain block');
    expect(blockCode?.closest('pre')).toBeTruthy();
    expect(blockCode?.getAttribute('style') ?? '').not.toContain('background-color');
  });

  it('inline code 안의 custom syntax와 html alias는 변환하지 않는다', async () => {
    const markdown = [
      '`||스포일러||`',
      '',
      '`<span style="color:#3B82F6">파란 글자</span>`',
      '',
      '`<br />`',
      '',
      '`<hr />`',
    ].join('\n');
    const document = await renderServerDocument(markdown);
    const inlineCodes = Array.from(document.querySelectorAll('code'));

    expect(inlineCodes.map(node => node.textContent)).toEqual([
      '||스포일러||',
      '<span style="color:#3B82F6">파란 글자</span>',
      '<br />',
      '<hr />',
    ]);
    expect(inlineCodes.every(node => node.closest('pre') === null)).toBe(true);
    expect(document.querySelector('button[aria-expanded]')).toBeNull();
    expect(document.querySelector('hr')).toBeNull();
  });

  it('본문이 비어 있으면 대체 문구를 렌더링한다', async () => {
    const element = await MarkdownRenderer({
      emptyText: '본문이 없습니다.',
      markdown: null,
    });

    render(element);

    expect(screen.getByText('본문이 없습니다.')).toBeTruthy();
  });

  it('spoiler는 preview에서도 button으로 렌더링된다', async () => {
    const document = await renderServerDocument('||스포일러||');
    const spoilerButton = document.querySelector('button[aria-expanded]');
    const spoilerStatus = document.querySelector('[role="status"]');

    expect(spoilerButton?.getAttribute('aria-describedby')).toBeTruthy();
    expect(spoilerButton?.textContent).toBe('스포일러');
    expect(spoilerStatus?.textContent).toContain('숨겨진 내용');
  });

  it('preview title이 있는 링크는 제목 링크 카드로 렌더링한다', async () => {
    const document = await renderServerDocument(
      '[OpenAI](https://github.com/openai/openai "preview")',
    );
    const embedCard = document.querySelector('[data-link-embed-card="true"]');

    expect(embedCard).toBeTruthy();
    expect(embedCard?.textContent).toContain('링크 정보를 불러오는 중...');
  });

  it('card title이 있는 링크는 OG 카드 영역으로 렌더링한다', async () => {
    const document = await renderServerDocument('[OpenAI](https://openai.com/ "card")');

    expect(document.querySelector('[data-link-embed-card="true"]')).toBeTruthy();
  });

  it('embed 키워드 링크는 LinkEmbed 카드 영역으로 렌더링한다', async () => {
    const document = await renderServerDocument('[embed](https://github.com/openai/openai)');

    expect(document.querySelector('[data-link-embed-card="true"]')).toBeTruthy();
  });

  it('일반 외부 링크는 카드 없이 일반 링크만 렌더링한다', async () => {
    const document = await renderServerDocument('[OpenAI](https://openai.com/)');

    expect(document.querySelector('[data-link-embed-card="true"]')).toBeNull();
    expect(document.querySelector('a')?.getAttribute('href')).toBe('https://openai.com/');
  });

  it('custom syntax preview를 직접 렌더링한다', async () => {
    const markdown = [
      '<span style="color:#3B82F6">파란 글자</span>',
      '',
      '<span style="background-color:#EAB308">배경 강조</span>',
      '',
      '<span style="color:#3B82F6; background-color:#EAB308">복합 강조</span>',
      '',
      '||스포일러||',
      '',
      '-# 보조 문구',
      '',
      '<YouTube id="dQw4w9WgXcQ" />',
      '',
      ':::toggle ## 토글 제목',
      '토글 본문',
      ':::',
      '',
      ':::toggle 일반 토글',
      '목록 본문',
      ':::',
      '',
      ':::align right',
      '정렬 본문',
      ':::',
    ].join('\n');
    const html = await renderServerHtml(markdown);
    const document = await renderServerDocument(markdown);
    const spoiler = Array.from(document.querySelectorAll('button[aria-expanded]')).find(node =>
      node.textContent?.includes('스포일러'),
    );
    const subtext = Array.from(document.querySelectorAll('p')).find(node =>
      node.textContent?.includes('보조 문구'),
    );
    const iframe = document.querySelector('iframe');
    const details = document.querySelector('details');
    const headingToggleChevron = details?.querySelector('svg[data-toggle-chevron="true"]');
    const toggleListDetails = Array.from(document.querySelectorAll('details')).find(node =>
      node.textContent?.includes('일반 토글'),
    );
    const toggleChevron = toggleListDetails?.querySelector('svg[data-toggle-chevron="true"]');
    const textOnlyColor = Array.from(document.querySelectorAll('span[style]')).find(node =>
      node.textContent?.includes('파란 글자'),
    );
    const backgroundOnlyColor = Array.from(document.querySelectorAll('span[style]')).find(node =>
      node.textContent?.includes('배경 강조'),
    ) as HTMLSpanElement | undefined;
    const mixedColor = Array.from(document.querySelectorAll('span[style]')).find(node =>
      node.textContent?.includes('복합 강조'),
    );

    expect(html).toContain('파란 글자');
    expect(html).toContain('배경 강조');
    expect(html).toContain('복합 강조');
    expect(html).toContain('text-align:right');
    expect(textOnlyColor?.getAttribute('style')).toContain('color');
    expect(textOnlyColor?.getAttribute('style')).not.toContain('background-color');
    expect(backgroundOnlyColor?.getAttribute('style')).toContain('background-color');
    expect(backgroundOnlyColor?.style.color).toBe('');
    expect(mixedColor?.getAttribute('style')).toContain('background-color');
    expect(mixedColor?.getAttribute('style')).toContain('color');
    expect(spoiler).toBeTruthy();
    expect(subtext?.textContent).toContain('보조 문구');
    expect(iframe?.getAttribute('src')).toContain('dQw4w9WgXcQ');
    expect(details?.textContent).toContain('토글 제목');
    expect(details?.textContent).toContain('토글 본문');
    expect(headingToggleChevron).toBeTruthy();
    expect(toggleListDetails?.textContent).toContain('일반 토글');
    expect(toggleListDetails?.textContent).toContain('목록 본문');
    expect(toggleChevron).toBeTruthy();
  });

  it('task list는 checkbox와 task-list-item class를 유지한다', async () => {
    const document = await renderServerDocument(
      ['- [ ] 첫 번째 할 일', '- [x] 두 번째 할 일'].join('\n'),
    );
    const taskItems = Array.from(document.querySelectorAll('li.task-list-item'));
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));

    expect(taskItems).toHaveLength(2);
    expect(checkboxes).toHaveLength(2);
  });

  it('제목이 비어 있는 toggle은 안전한 fallback title을 렌더링한다', async () => {
    const document = await renderServerDocument([':::toggle ### ', '본문', ':::'].join('\n'));
    const summaryLabel = document.querySelector('summary span');

    expect(summaryLabel?.textContent).toContain('Untitled toggle');
  });
});
