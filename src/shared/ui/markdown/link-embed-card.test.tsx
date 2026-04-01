import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { LinkEmbedCard } from '@/shared/ui/markdown/link-embed-card';

import '@testing-library/jest-dom/vitest';

describe('LinkEmbedCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('host fetcher가 대기 중이면, LinkEmbedCard는 로딩 skeleton을 렌더링해야 한다', () => {
    render(
      <LinkEmbedCard
        fetchLinkPreviewMeta={() => new Promise(() => undefined)}
        url="https://github.com/openai/openai"
        variant="card"
      />,
    );

    expect(screen.getByText('링크 정보를 불러오는 중...')).toBeInTheDocument();
  });

  it('유효한 preview metadata가 주어지면, LinkEmbedCard는 card variant를 렌더링해야 한다', async () => {
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

  it('유효한 preview metadata가 주어지면, LinkEmbedCard는 카드 본문 텍스트 없이 preview variant를 렌더링해야 한다', async () => {
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

  it('preview metadata가 부족하면, LinkEmbedCard는 일반 외부 링크로 fallback해야 한다', async () => {
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

  it('host fetcher가 실패하면, LinkEmbedCard는 일반 외부 링크로 fallback해야 한다', async () => {
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

  it('host fetcher가 없으면, LinkEmbedCard는 기본 앱 preview 요청을 계속 사용해야 한다', async () => {
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
