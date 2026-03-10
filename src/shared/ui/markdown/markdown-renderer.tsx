import React from 'react';
import { MarkdownAsync } from 'react-markdown';

import {
  getMarkdownOptions,
  markdownBodyClass,
  markdownEmptyTextClass,
} from '@/shared/lib/markdown/markdown-config';

type MarkdownRendererProps = {
  emptyText?: string;
  markdown: string | null;
};

/**
 * Markdown 문자열을 SSR 친화적인 React 노드로 렌더링합니다.
 */
export const MarkdownRenderer = async ({ emptyText, markdown }: MarkdownRendererProps) => {
  if (!markdown) return emptyText ? <p className={markdownEmptyTextClass}>{emptyText}</p> : null;

  const markdownOptions = getMarkdownOptions();

  return (
    <div className={markdownBodyClass}>
      <MarkdownAsync {...markdownOptions}>{markdown}</MarkdownAsync>
    </div>
  );
};
