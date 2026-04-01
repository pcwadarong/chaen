/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import React from 'react';

import { renderRichMarkdown } from '@/shared/lib/markdown/rich-markdown';

/**
 * rich-markdown fragment를 단순 텍스트 div로 렌더링하는 테스트용 renderer입니다.
 *
 * @param markdown 렌더링할 markdown fragment입니다.
 * @param key React key입니다.
 * @returns 테스트용 fragment 노드를 반환합니다.
 */
const renderMarkdownFragment = (markdown: string, key: string) => (
  <div data-fragment="true" key={key}>
    {markdown}
  </div>
);

describe('rich-markdown renderer registry', () => {
  it('custom video renderer override가 주어지면, renderRichMarkdown은 기본 video renderer 대신 override된 node를 렌더링해야 한다', () => {
    render(
      <div>
        {renderRichMarkdown({
          markdown: '<Video provider="youtube" id="dQw4w9WgXcQ" />',
          renderMarkdownFragment,
          renderers: {
            video: ({ key, segment }) => (
              <div data-custom-video="true" key={key}>
                {segment.provider === 'youtube' ? segment.videoId : ''}
              </div>
            ),
          },
        })}
      </div>,
    );

    expect(screen.getByText('dQw4w9WgXcQ')).toBeTruthy();
    expect(document.querySelector('[data-custom-video="true"]')).toBeTruthy();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('nested toggle content가 주어지면, renderRichMarkdown은 같은 custom renderer registry를 재귀적으로 재사용해야 한다', () => {
    render(
      <div>
        {renderRichMarkdown({
          markdown: [
            ':::toggle ## 제목',
            '<Video provider="youtube" id="dQw4w9WgXcQ" />',
            ':::',
          ].join('\n'),
          renderMarkdownFragment,
          renderers: {
            video: ({ key, segment }) => (
              <div data-custom-video="true" key={key}>
                {segment.provider === 'youtube' ? segment.videoId : ''}
              </div>
            ),
          },
        })}
      </div>,
    );

    expect(document.querySelector('[data-custom-video="true"]')).toBeTruthy();
    expect(document.querySelector('details')).toBeTruthy();
    expect(document.querySelector('iframe')).toBeNull();
  });
});
