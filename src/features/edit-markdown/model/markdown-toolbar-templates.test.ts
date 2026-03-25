import {
  createAlignBlockMarkdown,
  createImageEmbedMarkdown,
  createToggleBlockMarkdown,
  createYoutubeEmbedMarkdown,
  extractYoutubeId,
} from '@/features/edit-markdown/model/markdown-toolbar-templates';

describe('markdown-toolbar template helpers', () => {
  it('이미지 markdown는 선택한 공백을 그대로 유지한다', () => {
    expect(createImageEmbedMarkdown('  alt text  ', 'https://example.com/image.png')).toBe(
      '![  alt text  ](https://example.com/image.png)',
    );
  });

  it('align block markdown를 생성한다', () => {
    expect(createAlignBlockMarkdown('center')).toBe(':::align center\n텍스트\n:::');
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

  it('YouTube URL에서 안전한 호스트와 첫 path segment만 video id로 사용한다', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ/extra')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share')).toBe(
      'dQw4w9WgXcQ',
    );
    expect(extractYoutubeId('https://notyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(createYoutubeEmbedMarkdown('dQw4w9WgXcQ')).toBe('<YouTube id="dQw4w9WgXcQ" />');
  });
});
