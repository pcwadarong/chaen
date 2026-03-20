import React from 'react';
import { MarkdownAsync } from 'react-markdown';

import { collectMarkdownImages } from '@/shared/lib/markdown/collect-markdown-images';
import {
  getMarkdownOptions,
  markdownBodyClass,
  markdownEmptyTextClass,
} from '@/shared/lib/markdown/markdown-config';
import { renderRichMarkdown } from '@/shared/lib/markdown/rich-markdown';

type MarkdownRendererProps = {
  emptyText?: string;
  locale?: string;
  markdown: string | null;
};

/**
 * Markdown 문자열을 SSR 친화적인 React 노드로 렌더링합니다.
 */
export const MarkdownRenderer = async ({ emptyText, locale, markdown }: MarkdownRendererProps) => {
  if (!markdown) return emptyText ? <p className={markdownEmptyTextClass}>{emptyText}</p> : null;

  const markdownOptions = getMarkdownOptions({
    items: collectMarkdownImages(markdown),
  });

  return (
    <div className={markdownBodyClass} lang={locale}>
      {renderRichMarkdown({
        markdown,
        renderMarkdownFragment: (fragmentMarkdown, key) => (
          <MarkdownAsync key={key} {...markdownOptions}>
            {fragmentMarkdown}
          </MarkdownAsync>
        ),
      })}
    </div>
  );
};
