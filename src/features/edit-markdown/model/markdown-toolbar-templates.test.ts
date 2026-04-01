/** @vitest-environment node */

import {
  createAlignBlockMarkdown,
  createAttachmentEmbedMarkdown,
  createImageEmbedMarkdown,
  createImageEmbedMarkdownGroup,
  createImageGalleryMarkdown,
  createMathEmbedMarkdown,
  createToggleBlockMarkdown,
} from '@/entities/editor-core/model/markdown-templates';

describe('markdown-toolbar template helpers', () => {
  it('이미지 markdown는 선택한 공백을 유지하면서 특수문자를 이스케이프한다', () => {
    expect(createImageEmbedMarkdown('  alt] text  ', 'https://example.com/image).png')).toBe(
      '![  alt\\] text  ](https://example.com/image\\).png)',
    );
  });

  it('gallery markdown는 여러 이미지를 gallery block 문법으로 묶는다', () => {
    expect(
      createImageGalleryMarkdown([
        { altText: '이미지 1', url: 'https://example.com/one.png' },
        { altText: '이미지 2', url: 'https://example.com/two.png' },
      ]),
    ).toBe(
      [
        ':::gallery',
        '![이미지 1](https://example.com/one.png)',
        '![이미지 2](https://example.com/two.png)',
        ':::',
      ].join('\n'),
    );
  });

  it('개별 이미지 group markdown는 여러 이미지를 빈 줄로 연결한다', () => {
    expect(
      createImageEmbedMarkdownGroup([
        { altText: '이미지 1', url: 'https://example.com/one.png' },
        { altText: '이미지 2', url: 'https://example.com/two.png' },
      ]),
    ).toBe(
      ['![이미지 1](https://example.com/one.png)', '![이미지 2](https://example.com/two.png)'].join(
        '\n\n',
      ),
    );
  });

  it('align block markdown를 생성하고 정렬별 cursor offset을 함께 반환한다', () => {
    expect(createAlignBlockMarkdown('left')).toEqual({
      cursorOffset: ':::align left\n'.length,
      text: ':::align left\n텍스트\n:::',
    });
    expect(createAlignBlockMarkdown('center')).toEqual({
      cursorOffset: ':::align center\n'.length,
      text: ':::align center\n텍스트\n:::',
    });
    expect(createAlignBlockMarkdown('right')).toEqual({
      cursorOffset: ':::align right\n'.length,
      text: ':::align right\n텍스트\n:::',
    });
  });

  it('빈 토글 제목은 placeholder 없는 기본 토글 템플릿을 생성한다', () => {
    expect(createToggleBlockMarkdown(4, '')).toEqual({
      cursorOffset: 15,
      text: ':::toggle #### \n:::',
    });
  });

  it('선택된 제목이 있으면 토글 본문까지 포함한 템플릿을 생성한다', () => {
    expect(createToggleBlockMarkdown(2, '제목')).toEqual({
      cursorOffset: 15,
      text: ':::toggle ## 제목\n내용\n:::',
    });
  });

  it('첨부 파일 markdown는 속성을 안전하게 escape하고 size/type을 함께 담는다', () => {
    expect(
      createAttachmentEmbedMarkdown({
        contentType: 'application/pdf',
        fileName: 'resume "v2".pdf',
        fileSize: 2048,
        url: 'https://example.com/resume.pdf',
      }),
    ).toBe(
      '<Attachment href="https://example.com/resume.pdf" name="resume &quot;v2&quot;.pdf" size="2048" type="application/pdf" />',
    );
  });

  it('수식 markdown는 inline/block 여부를 구분하고 줄바꿈을 한 줄로 정리한다', () => {
    expect(
      createMathEmbedMarkdown({
        formula: 'a^2 + b^2 = c^2',
        isBlock: false,
      }),
    ).toBe('<Math>a^2 + b^2 = c^2</Math>');
    expect(
      createMathEmbedMarkdown({
        formula: '\\begin{cases}\n x, &x \\ge 0 \\\\\n -x, &x < 0\n\\end{cases}',
        isBlock: true,
      }),
    ).toBe(
      '\n<Math block="true">\\begin{cases} x, &x \\ge 0 \\\\ -x, &x < 0 \\end{cases}</Math>\n',
    );
  });
});
