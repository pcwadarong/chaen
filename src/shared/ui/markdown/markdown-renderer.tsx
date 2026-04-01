import React from 'react';
import { MarkdownAsync } from 'react-markdown';

import type { MarkdownRendererHostAdapters } from '@/entities/editor-core';
import { collectMarkdownImages } from '@/shared/lib/markdown/collect-markdown-images';
import {
  getMarkdownOptions,
  markdownBodyClass,
  markdownEmptyTextClass,
} from '@/shared/lib/markdown/markdown-config';
import { renderRichMarkdown } from '@/shared/lib/markdown/rich-markdown';
import type { PartialRichMarkdownRendererRegistry } from '@/shared/lib/markdown/rich-markdown-renderers';

type MarkdownRendererProps = {
  adapters?: MarkdownRendererHostAdapters;
  emptyText?: string;
  locale?: string;
  markdown: string | null;
  renderers?: PartialRichMarkdownRendererRegistry;
};

/**
 * Markdown 문자열을 SSR 친화적인 React 노드로 렌더링합니다.
 */
export const MarkdownRenderer = async ({
  adapters,
  emptyText,
  locale,
  markdown,
  renderers,
}: MarkdownRendererProps) => {
  if (!markdown) return emptyText ? <p className={markdownEmptyTextClass}>{emptyText}</p> : null;

  const markdownOptions = getMarkdownOptions({
    adapters,
    items: collectMarkdownImages(markdown),
  });

  return (
    <div className={markdownBodyClass} lang={locale}>
      {renderRichMarkdown({
        adapters,
        markdown,
        renderMarkdownFragment: (fragmentMarkdown, key) => (
          <MarkdownAsync key={key} {...markdownOptions}>
            {fragmentMarkdown}
          </MarkdownAsync>
        ),
        renderers,
      })}
    </div>
  );
};
