/** @vitest-environment node */

import {
  parseRichMarkdownSegments,
  parseToggleTitle,
} from '@/shared/lib/markdown/rich-markdown-segments';

describe('rich-markdown segment parser', () => {
  it('Under a heading-prefixed toggle title, parseToggleTitle must split the heading level and visible title', () => {
    expect(parseToggleTitle('### 토글 제목')).toEqual({
      headingLevel: 3,
      title: '토글 제목',
    });
  });

  it('Under mixed custom syntax blocks, parseRichMarkdownSegments must preserve markdown chunks and custom segments in order', () => {
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

  it('Under custom syntax inside fenced code blocks, parseRichMarkdownSegments must keep the whole block as plain markdown', () => {
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
