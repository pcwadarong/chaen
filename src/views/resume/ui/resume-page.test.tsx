import React from 'react';
import { renderToReadableStream } from 'react-dom/server';

import { ResumePage } from '@/views/resume/ui/resume-page';

/**
 * resume 페이지 서버 렌더링 결과를 HTML 문자열로 수집합니다.
 */
const renderResumePageHtml = async () => {
  const stream = await renderToReadableStream(
    <ResumePage
      content={{
        body: ['## 핵심 경험', '', '- Next.js App Router', '- Markdown preview'].join('\n'),
        description: '설명',
        locale: 'ko',
        title: '박채원 이력서',
        updated_at: '2026-03-20T00:00:00.000Z',
      }}
      downloadLabel="이력서 다운로드"
      unavailableLabel="이력서 준비 중"
    />,
  );

  return new Response(stream).text();
};

describe('ResumePage', () => {
  it('본문을 markdown 렌더링 결과로 노출한다', async () => {
    const html = await renderResumePageHtml();
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(document.querySelector('h2')?.textContent).toContain('핵심 경험');
    expect(document.querySelector('ul li')?.textContent).toBe('Next.js App Router');
    expect(document.querySelector('div[lang="ko"]')).toBeTruthy();
  });
});
