import { collectMarkdownImages } from '@/shared/lib/markdown/collect-markdown-images';

describe('collectMarkdownImages', () => {
  it('마크다운 본문에서 이미지 목록을 순서대로 추출한다', () => {
    const markdown = [
      '![첫 번째](https://example.com/one.png)',
      '',
      '텍스트',
      '',
      '![두 번째](https://example.com/two.png "title")',
    ].join('\n');

    expect(collectMarkdownImages(markdown)).toEqual([
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
    ]);
  });

  it('빈 src 이미지는 제외한다', () => {
    expect(collectMarkdownImages('![]( )')).toEqual([]);
  });
});
