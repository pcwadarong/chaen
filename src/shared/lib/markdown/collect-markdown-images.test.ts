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

  it('gallery 블록이 앞에 있어도, collectMarkdownImages는 일반 markdown 이미지에만 viewer id를 부여해야 한다', () => {
    const markdown = [
      ':::gallery',
      '![갤러리 첫 번째](https://example.com/gallery-one.png)',
      '![갤러리 두 번째](https://example.com/gallery-two.png)',
      ':::',
      '',
      '![본문 이미지](https://example.com/standalone.png)',
    ].join('\n');

    expect(collectMarkdownImages(markdown)).toEqual([
      {
        alt: '본문 이미지',
        src: 'https://example.com/standalone.png',
        viewerId: 'markdown-image-0',
      },
    ]);
  });
});
