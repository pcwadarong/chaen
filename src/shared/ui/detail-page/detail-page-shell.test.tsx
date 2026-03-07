import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { vi } from 'vitest';

import { DetailPageShell } from '@/shared/ui/detail-page/detail-page-shell';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

/**
 * 서버 컴포넌트 결과를 HTML 문자열로 수집합니다.
 */
const renderServerHtml = async () => {
  const element = await DetailPageShell({
    bottomContent: <section data-testid="detail-bottom-content">댓글 영역</section>,
    content: '상세 본문',
    emptyArchiveText: '비어있음',
    emptyContentText: '본문 없음',
    guestbookCtaText: '방명록에 글 남기고 가기',
    heroDescription: '설명',
    metaBar: <div data-testid="detail-meta-bar">메타 바</div>,
    sidebarItems: [],
    sidebarLabel: '아카이브',
    tagContent: <div>태그</div>,
    title: '상세 제목',
  });
  const stream = await renderToReadableStream(element);

  return new Response(stream).text();
};

describe('DetailPageShell', () => {
  it('hero 아래에 메타 바를 두고 그 다음에 markdown 본문을 렌더링한다', async () => {
    const html = await renderServerHtml();

    expect(html).toContain('<h1');
    expect(html).toContain('상세 제목</h1>');
    expect(html).toContain('data-testid="detail-meta-bar"');
    expect(html.indexOf('상세 제목</h1>')).toBeLessThan(
      html.indexOf('data-testid="detail-meta-bar"'),
    );
    expect(html.indexOf('data-testid="detail-meta-bar"')).toBeLessThan(html.indexOf('상세 본문'));
    expect(html).toContain('href="/guest"');
    expect(html.indexOf('href="/guest"')).toBeLessThan(
      html.indexOf('data-testid="detail-bottom-content"'),
    );
  });
});
