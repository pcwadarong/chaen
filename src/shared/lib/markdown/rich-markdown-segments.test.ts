/** @vitest-environment node */

import {
  parseRichMarkdownSegments,
  parseToggleTitle,
} from '@/entities/editor-core/model/markdown-segments';

describe('rich-markdown segment parser', () => {
  it('heading prefix가 포함된 toggle title이 주어지면, parseToggleTitle은 heading level과 표시 title을 분리해야 한다', () => {
    expect(parseToggleTitle('### 토글 제목')).toEqual({
      headingLevel: 3,
      title: '토글 제목',
    });
  });

  it('여러 custom syntax block이 섞여 있으면, parseRichMarkdownSegments는 markdown chunk와 custom segment 순서를 그대로 유지해야 한다', () => {
    expect(
      parseRichMarkdownSegments(
        [
          '앞 문단',
          ':::gallery',
          '![첫 번째](https://example.com/one.png)',
          '![두 번째](https://example.com/two.png)',
          ':::',
          '<Video provider="youtube" id="dQw4w9WgXcQ" />',
          '<Attachment href="https://example.com/resume.pdf" name="resume.pdf" size="2048" type="application/pdf" />',
          '<Math block="true">a^2 + b^2 = c^2</Math>',
          '-# 보조 문구',
        ].join('\n'),
      ),
    ).toEqual([
      {
        markdown: '앞 문단',
        type: 'markdown',
      },
      {
        items: [
          {
            alt: '첫 번째',
            src: 'https://example.com/one.png',
            viewerId: 'markdown-image-0',
          },
          {
            alt: '두 번째',
            src: 'https://example.com/two.png',
            viewerId: 'markdown-image-1',
          },
        ],
        type: 'gallery',
      },
      {
        provider: 'youtube',
        src: undefined,
        type: 'video',
        videoId: 'dQw4w9WgXcQ',
      },
      {
        contentType: 'application/pdf',
        fileName: 'resume.pdf',
        fileSize: 2048,
        href: 'https://example.com/resume.pdf',
        type: 'attachment',
      },
      {
        formula: 'a^2 + b^2 = c^2',
        isBlock: true,
        type: 'math',
      },
      {
        content: '보조 문구',
        type: 'subtext',
      },
    ]);
  });

  it('fenced code block 안에 custom syntax가 있어도, parseRichMarkdownSegments는 전체 block을 plain markdown로 유지해야 한다', () => {
    expect(
      parseRichMarkdownSegments(
        ['```md', '<Video provider="youtube" id="dQw4w9WgXcQ" />', '```'].join('\n'),
      ),
    ).toEqual([
      {
        markdown: ['```md', '<Video provider="youtube" id="dQw4w9WgXcQ" />', '```'].join('\n'),
        type: 'markdown',
      },
    ]);
  });
});
