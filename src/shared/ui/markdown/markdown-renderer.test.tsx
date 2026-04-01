import { render, screen } from '@testing-library/react';
import { renderToReadableStream } from 'react-dom/server';

import { collectMarkdownImages } from '@/shared/lib/markdown/collect-markdown-images';
import { MarkdownRenderer } from '@/shared/ui/markdown/markdown-renderer';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    (
      ({
        closeAriaLabel: '이미지 뷰어 닫기',
        imageViewerAriaLabel: '이미지 뷰어',
        nextAriaLabel: '다음 이미지 보기',
        openAriaLabel: '이미지 크게 보기',
        previousAriaLabel: '이전 이미지 보기',
        thumbnailListAriaLabel: '이미지 썸네일 목록',
        zoomInAriaLabel: '이미지 확대',
        zoomOutAriaLabel: '이미지 축소',
      }) as const
    )[key] ?? key,
}));

vi.mock('@/shared/lib/storage/attachment-download-path', () => ({
  resolveAttachmentDownloadHref: vi.fn(({ href }: { href: string }) => href),
}));

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
  it('이미지 목록 helper는 본문 이미지 순서와 viewer id를 안정적으로 만든다', () => {
    expect(
      collectMarkdownImages(
        ['![첫 번째](https://example.com/one.png)', '![두 번째](https://example.com/two.png)'].join(
          '\n',
        ),
      ),
    ).toEqual([
      { alt: '첫 번째', src: 'https://example.com/one.png', viewerId: 'markdown-image-0' },
      { alt: '두 번째', src: 'https://example.com/two.png', viewerId: 'markdown-image-1' },
    ]);
  });

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

  it('이미지를 반응형 뷰어 트리거 이미지로 렌더링한다', async () => {
    const document = await renderServerDocument('![설명](https://example.com/image.png "샘플")');
    const image = document.querySelector('img[role="button"]');

    expect(image).toBeTruthy();
    expect(image?.getAttribute('src')).toBe('https://example.com/image.png');
    expect(image?.getAttribute('alt')).toBe('설명');
    expect(image?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(image?.className).toBeTruthy();
  });

  it('host image viewer labels가 주어지면, MarkdownRenderer는 해당 열기 라벨을 이미지 트리거에 반영해야 한다', async () => {
    const element = await MarkdownRenderer({
      adapters: {
        imageViewerLabels: {
          actionBarAriaLabel: '액션 바',
          closeAriaLabel: '닫기',
          fitToScreenAriaLabel: '화면 맞춤',
          imageViewerAriaLabel: '커스텀 이미지 뷰어',
          locateSourceAriaLabel: '위치로 이동',
          nextAriaLabel: '다음',
          openAriaLabel: '커스텀 열기',
          previousAriaLabel: '이전',
          selectForFrameAriaLabel: '프레임용 선택',
          selectForFrameLabel: '프레임 선택',
          thumbnailListAriaLabel: '썸네일 목록',
          zoomInAriaLabel: '확대',
          zoomOutAriaLabel: '축소',
        },
      },
      markdown: '![설명](https://example.com/image.png)',
    });
    const stream = await renderToReadableStream(element);
    const html = await new Response(stream).text();
    const document = new DOMParser().parseFromString(html, 'text/html');
    const image = document.querySelector('img[role="button"]');

    expect(image?.getAttribute('aria-label')).toBe('설명 · 커스텀 열기');
  });

  it('첨부 파일 커스텀 태그를 다운로드 카드 링크로 렌더링한다', async () => {
    const document = await renderServerDocument(
      '<Attachment href="https://example.com/resume.pdf" name="resume.pdf" size="2048" type="application/pdf" />',
    );
    const attachmentCard = document.querySelector('[data-markdown-attachment="true"]');
    const downloadLink = attachmentCard?.querySelector('a[download="resume.pdf"]');

    expect(attachmentCard).toBeTruthy();
    expect(downloadLink).toBeTruthy();
    expect(downloadLink?.getAttribute('href')).toBe('https://example.com/resume.pdf');
    expect(attachmentCard?.textContent).toContain('resume.pdf');
    expect(attachmentCard?.textContent).toContain('2 KB');
    expect(downloadLink?.textContent).toContain('다운로드');
  });

  it('첨부 파일 속성의 HTML entity를 복원해 파일명과 href를 그대로 사용한다', async () => {
    const document = await renderServerDocument(
      '<Attachment href="https://example.com/download?name=R&amp;D&amp;v=2" name="R&amp;D &quot;v2&quot;.pdf" size="2048" type="application/pdf" />',
    );
    const attachmentCard = document.querySelector('[data-markdown-attachment="true"]');
    const downloadLink = attachmentCard?.querySelector('a[download]');

    expect(attachmentCard?.textContent).toContain('R&D "v2".pdf');
    expect(downloadLink?.getAttribute('download')).toBe('R&D "v2".pdf');
    expect(downloadLink?.getAttribute('href')).toBe('https://example.com/download?name=R&D&v=2');
  });

  it('수학 공식 커스텀 태그를 KaTeX 수식으로 렌더링한다', async () => {
    const document = await renderServerDocument('<Math block="true">a^2 + b^2 = c^2</Math>');
    const mathNode = document.querySelector('[data-markdown-math="block"]');

    expect(mathNode).toBeTruthy();
    expect(mathNode?.querySelector('.katex')).toBeTruthy();
    expect(mathNode?.textContent).toContain('a');
    expect(mathNode?.textContent).toContain('b');
    expect(mathNode?.textContent).toContain('c');
  });

  it('문장 중간의 inline 수학 공식도 공백과 함께 KaTeX로 렌더링한다', async () => {
    const document = await renderServerDocument('합은 <Math>a^2 + b^2</Math> 입니다');
    const wrapper = document.querySelector('div');
    const inlineMathNode = document.querySelector('[data-markdown-math="inline"]');

    expect(wrapper?.textContent).toContain('합은');
    expect(wrapper?.textContent).toContain('입니다');
    expect(inlineMathNode).toBeTruthy();
    expect(inlineMathNode?.querySelector('.katex')).toBeTruthy();
  });

  it('여러 개의 inline 수학 공식은 각각 독립적으로 렌더링한다', async () => {
    const document = await renderServerDocument(
      '첫째는 <Math>a^2</Math> 이고 둘째는 <Math>b^2</Math> 입니다',
    );
    const inlineMathNodes = Array.from(document.querySelectorAll('[data-markdown-math="inline"]'));

    expect(inlineMathNodes).toHaveLength(2);
    expect(inlineMathNodes[0]?.textContent).toContain('a');
    expect(inlineMathNodes[1]?.textContent).toContain('b');
  });

  it('잘못된 inline 수식은 원문과 오류 힌트를 함께 fallback으로 렌더링한다', async () => {
    const document = await renderServerDocument('합은 <Math>\\fra{a}{b}</Math> 입니다');
    const inlineMathNode = document.querySelector('[data-markdown-math="inline"]');

    expect(inlineMathNode).toBeTruthy();
    expect(inlineMathNode?.getAttribute('data-markdown-math-error')).toBe('true');
    expect(inlineMathNode?.textContent).toContain('\\fra{a}{b}');
    expect(inlineMathNode?.textContent).toContain('수식 오류');
    expect(inlineMathNode?.querySelector('.katex')).toBeNull();
  });

  it('잘못된 block 수식은 원문과 상세 오류 메시지를 fallback으로 렌더링한다', async () => {
    const document = await renderServerDocument('<Math block="true">\\begin{cases} x </Math>');
    const blockMathNode = document.querySelector('[data-markdown-math="block"]');

    expect(blockMathNode).toBeTruthy();
    expect(blockMathNode?.getAttribute('data-markdown-math-error')).toBe('true');
    expect(blockMathNode?.textContent).toContain('\\begin{cases} x');
    expect(blockMathNode?.textContent).toContain('수식 오류');
    expect(blockMathNode?.querySelector('.katex')).toBeNull();
  });

  it('gallery 블록은 슬라이더와 진행 바를 포함한 이미지 갤러리로 렌더링한다', async () => {
    const document = await renderServerDocument(
      [
        ':::gallery',
        '![첫 번째](https://example.com/one.png)',
        '![두 번째](https://example.com/two.png)',
        ':::',
      ].join('\n'),
    );
    const gallery = document.querySelector('[data-markdown-gallery="true"]');
    const images = Array.from(gallery?.querySelectorAll('img') ?? []);
    const progress = gallery?.querySelector('[aria-label="총 2장의 이미지 중 1번째"]');

    expect(gallery).toBeTruthy();
    expect(gallery?.getAttribute('data-markdown-gallery-count')).toBe('2');
    expect(images).toHaveLength(2);
    expect(images[0]?.getAttribute('src')).toBe('https://example.com/one.png');
    expect(images[1]?.getAttribute('src')).toBe('https://example.com/two.png');
    expect(images[0]?.getAttribute('alt')).toBe('첫 번째');
    expect(images[1]?.getAttribute('alt')).toBe('두 번째');
    expect(gallery?.querySelector('button[aria-label="이전 이미지"]')).toBeTruthy();
    expect(gallery?.querySelector('button[aria-label="다음 이미지"]')).toBeTruthy();
    expect(progress).toBeTruthy();
    expect(progress?.getAttribute('role')).toBe('progressbar');
    expect(progress?.getAttribute('aria-valuenow')).toBe('1');
  });

  it('gallery 뒤에 일반 이미지가 오면, MarkdownRenderer는 일반 이미지 viewer id를 gallery와 독립적으로 유지해야 한다', async () => {
    const document = await renderServerDocument(
      [
        ':::gallery',
        '![첫 번째](https://example.com/one.png)',
        '![두 번째](https://example.com/two.png)',
        ':::',
        '',
        '![본문 이미지](https://example.com/standalone.png)',
      ].join('\n'),
    );

    const standaloneImage = document.querySelector(
      'img[data-markdown-viewer-id="markdown-image-0"][src="https://example.com/standalone.png"]',
    );

    expect(standaloneImage).toBeTruthy();
  });

  it('새 Video 문법이 주어지면, MarkdownRenderer는 YouTube iframe을 렌더링해야 한다', async () => {
    const document = await renderServerDocument('<Video provider="youtube" id="dQw4w9WgXcQ" />');
    const iframe = document.querySelector('iframe');

    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('유효하지 않은 YouTube video id가 주어지면, MarkdownRenderer는 iframe을 렌더링하지 않아야 한다', async () => {
    const document = await renderServerDocument('<Video provider="youtube" id="invalid-script" />');

    expect(document.querySelector('iframe')).toBeNull();
  });

  it('업로드 Video 문법이 주어지면, MarkdownRenderer는 HTML video 요소를 렌더링해야 한다', async () => {
    const document = await renderServerDocument(
      '<Video provider="upload" src="https://example.com/videos/demo.mp4" />',
    );
    const video = document.querySelector('video');

    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('https://example.com/videos/demo.mp4');
    expect(video?.getAttribute('controls')).not.toBeNull();
  });

  it('legacy YouTube 문법이 주어지면, MarkdownRenderer는 하위 호환으로 YouTube iframe을 렌더링해야 한다', async () => {
    const document = await renderServerDocument('<YouTube id="dQw4w9WgXcQ" />');
    const iframe = document.querySelector('iframe');

    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('mermaid fenced code block이 주어지면, MarkdownRenderer는 mermaid 렌더링 프레임을 렌더링해야 한다', async () => {
    const document = await renderServerDocument(
      ['```mermaid', 'flowchart TD', 'A --> B', '```'].join('\n'),
    );
    const mermaidFrame = document.querySelector('[data-markdown-mermaid="true"]');

    expect(mermaidFrame).toBeTruthy();
    expect(mermaidFrame?.textContent).toContain('Mermaid');
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

  it('줄 끝의 literal <br/> 뒤 Enter는 hard break와 다음 줄 분리를 함께 유지한다', async () => {
    const document = await renderServerDocument(['첫 번째 줄<br/>', '두 번째 줄'].join('\n'));
    const paragraphs = Array.from(document.querySelectorAll('p'));

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]?.textContent).toBe('첫 번째 줄');
    expect(paragraphs[1]?.textContent).toBe('두 번째 줄');
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

  it('plaintext fenced code block은 추가 inline color 없이 code class로 렌더링한다', async () => {
    const document = await renderServerDocument(['```', 'plain block', '```'].join('\n'));
    const blockCode = document.querySelector('pre code');

    expect(blockCode?.className).toBeTruthy();
    expect(blockCode?.getAttribute('style') ?? '').not.toContain('color:rgb(248, 250, 252)');
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

  it('inline code는 inline style 없이 전용 class로 렌더링한다', async () => {
    const document = await renderServerDocument('`inline code`');
    const inlineCode = document.querySelector('p code');

    expect(inlineCode?.className).toBeTruthy();
    expect(inlineCode?.getAttribute('style')).toBeNull();
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

  it('When custom syntax가 주어지면, 각 변환 구문은 preview에서 기대된 요소로 렌더링되어야 한다', async () => {
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
      '<Video provider="youtube" id="dQw4w9WgXcQ" />',
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

  it('When legacy YouTube custom syntax가 주어지면, video iframe 렌더링이 유지되어야 한다', async () => {
    const markdown = '<YouTube id="dQw4w9WgXcQ" />';
    const document = await renderServerDocument(markdown);
    const iframe = document.querySelector('iframe');

    expect(iframe?.getAttribute('src')).toContain('dQw4w9WgXcQ');
  });

  it('When Video 문법으로 provider와 id가 제공되면 iframe 렌더링으로 변환되어야 한다', async () => {
    const markdown = '<Video provider="youtube" id="dQw4w9WgXcQ" />';
    const document = await renderServerDocument(markdown);
    const iframe = document.querySelector('iframe');

    expect(iframe?.getAttribute('src')).toContain('dQw4w9WgXcQ');
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
