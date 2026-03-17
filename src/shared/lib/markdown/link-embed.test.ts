import { extractEmbedMetaFromHtml } from '@/shared/lib/markdown/link-embed';

describe('link-embed utils', () => {
  it('meta와 link attribute 순서가 바뀌어도 HTML fallback 메타를 추출한다', () => {
    const html = `
      <html>
        <head>
          <meta content="Open Graph Title" property="og:title">
          <meta content="설명" name="description">
          <meta content="OpenAI" property="og:site_name">
          <meta content="/preview.png" property="og:image">
          <link href="/favicon.ico" rel="icon">
          <title>ignored title</title>
        </head>
      </html>
    `;

    expect(extractEmbedMetaFromHtml('https://example.com/docs', html)).toEqual({
      description: '설명',
      favicon: 'https://example.com/favicon.ico',
      image: 'https://example.com/preview.png',
      siteName: 'OpenAI',
      title: 'Open Graph Title',
      url: 'https://example.com/docs',
    });
  });
});
