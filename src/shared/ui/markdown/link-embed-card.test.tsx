import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { LinkEmbedCard } from '@/shared/ui/markdown/link-embed-card';

import '@testing-library/jest-dom/vitest';

describe('LinkEmbedCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Under a pending host fetcher, LinkEmbedCard must render the loading skeleton', () => {
    render(
      <LinkEmbedCard
        fetchLinkPreviewMeta={() => new Promise(() => undefined)}
        url="https://github.com/openai/openai"
        variant="card"
      />,
    );

    expect(screen.getByText('링크 정보를 불러오는 중...')).toBeInTheDocument();
  });

  it('Under valid preview metadata, LinkEmbedCard must render the card variant', async () => {
    render(
      <LinkEmbedCard
        fetchLinkPreviewMeta={async () => ({
          description: 'Repository description',
          favicon: 'https://github.com/favicon.ico',
          image: 'https://opengraph.githubassets.com/image.png',
          siteName: 'GitHub',
          title: 'openai/openai',
          url: 'https://github.com/openai/openai',
        })}
        url="https://github.com/openai/openai"
        variant="card"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'openai/openai' })).toBeInTheDocument();
    });

    expect(screen.getByText('Repository description')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/openai/openai')).toBeInTheDocument();
  });

  it('Under valid preview metadata, LinkEmbedCard must render the preview variant without card body text', async () => {
    render(
      <LinkEmbedCard
        fetchLinkPreviewMeta={async () => ({
          description: 'Repository description',
          favicon: 'https://github.com/favicon.ico',
          image: 'https://opengraph.githubassets.com/image.png',
          siteName: 'GitHub',
          title: 'openai/openai',
          url: 'https://github.com/openai/openai',
        })}
        url="https://github.com/openai/openai"
        variant="preview"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'openai/openai' })).toBeInTheDocument();
    });

    expect(screen.queryByText('Repository description')).not.toBeInTheDocument();
    expect(screen.queryByText('https://github.com/openai/openai')).not.toBeInTheDocument();
  });

  it('Under insufficient preview metadata, LinkEmbedCard must fall back to a plain external link', async () => {
    render(
      <LinkEmbedCard
        fallbackLabel="Example"
        fetchLinkPreviewMeta={async () => ({
          description: '',
          favicon: null,
          image: null,
          siteName: 'example.com',
          title: 'https://example.com/',
          url: 'https://example.com/',
        })}
        url="https://example.com"
        variant="card"
      />,
    );

    const link = await screen.findByRole('link', { name: 'Example' });

    expect(link.getAttribute('href')).toBe('https://example.com/');
    expect(screen.queryByText('링크 정보를 불러오는 중...')).not.toBeInTheDocument();
  });

  it('Under a failed host fetcher, LinkEmbedCard must fall back to a plain external link', async () => {
    render(
      <LinkEmbedCard
        fallbackLabel="Fallback"
        fetchLinkPreviewMeta={async () => {
          throw new Error('network failed');
        }}
        url="https://example.com"
        variant="card"
      />,
    );

    const link = await screen.findByRole('link', { name: 'Fallback' });

    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('Under no host fetcher, LinkEmbedCard must keep using the default app preview request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          description: '',
          favicon: null,
          image: null,
          siteName: 'example.com',
          title: 'https://example.com/',
          url: 'https://example.com/',
        }),
        ok: true,
      }),
    );

    render(<LinkEmbedCard fallbackLabel="Fallback" url="https://example.com" variant="card" />);

    const link = await screen.findByRole('link', { name: 'Fallback' });

    expect(fetch).toHaveBeenCalledWith('/api/og?url=https%3A%2F%2Fexample.com', {
      signal: expect.any(AbortSignal),
    });
    expect(link.getAttribute('href')).toBe('https://example.com/');
  });
});
