/** @vitest-environment node */

import type { AnchorHTMLAttributes } from 'react';
import React from 'react';

import { getMarkdownOptions } from '@/shared/lib/markdown/markdown-config';
import { LinkEmbedCard } from '@/shared/ui/markdown/link-embed-card';

describe('markdown-config', () => {
  it('host link preview fetcher가 주어지면, getMarkdownOptions는 preview 링크 카드에 해당 fetcher를 전달해야 한다', () => {
    const fetchLinkPreviewMeta = vi.fn();
    const anchor = getMarkdownOptions({
      adapters: {
        fetchLinkPreviewMeta,
      },
    }).components?.a as
      | ((props: AnchorHTMLAttributes<HTMLAnchorElement>) => React.ReactNode)
      | undefined;

    const element = anchor?.({
      children: 'preview',
      href: 'https://example.com',
      title: 'preview',
    });

    expect(React.isValidElement(element)).toBe(true);

    if (!React.isValidElement(element)) {
      throw new Error('Link preview element must be a valid React element');
    }

    const linkEmbedElement = element as React.ReactElement<{
      fetchLinkPreviewMeta?: unknown;
    }>;

    expect(linkEmbedElement.type).toBe(LinkEmbedCard);
    expect(linkEmbedElement.props.fetchLinkPreviewMeta).toBe(fetchLinkPreviewMeta);
  });

  it('host link preview fetcher가 주어지면, getMarkdownOptions는 card 링크 카드에도 해당 fetcher를 전달해야 한다', () => {
    const fetchLinkPreviewMeta = vi.fn();
    const anchor = getMarkdownOptions({
      adapters: {
        fetchLinkPreviewMeta,
      },
    }).components?.a as
      | ((props: AnchorHTMLAttributes<HTMLAnchorElement>) => React.ReactNode)
      | undefined;

    const element = anchor?.({
      children: 'card',
      href: 'https://example.com',
      title: 'card',
    });

    expect(React.isValidElement(element)).toBe(true);

    if (!React.isValidElement(element)) {
      throw new Error('Link card element must be a valid React element');
    }

    const linkEmbedElement = element as React.ReactElement<{
      fetchLinkPreviewMeta?: unknown;
    }>;

    expect(linkEmbedElement.type).toBe(LinkEmbedCard);
    expect(linkEmbedElement.props.fetchLinkPreviewMeta).toBe(fetchLinkPreviewMeta);
  });
});
