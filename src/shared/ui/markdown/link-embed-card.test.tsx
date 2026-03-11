import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { LinkEmbedCard } from '@/shared/ui/markdown/link-embed-card';

describe('LinkEmbedCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('OG 데이터를 불러오는 동안 skeleton UI를 렌더링한다', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );

    render(<LinkEmbedCard url="https://github.com/openai/openai" variant="card" />);

    expect(screen.getByText('링크 정보를 불러오는 중...')).toBeTruthy();
  });

  it('OG 메타를 카드 형태로 렌더링한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          description: 'Repository description',
          favicon: 'https://github.com/favicon.ico',
          image: 'https://opengraph.githubassets.com/image.png',
          siteName: 'GitHub',
          title: 'openai/openai',
          url: 'https://github.com/openai/openai',
        }),
        ok: true,
      }),
    );

    render(<LinkEmbedCard url="https://github.com/openai/openai" variant="card" />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'openai/openai' })).toBeTruthy();
    });

    expect(screen.getByText('Repository description')).toBeTruthy();
    expect(screen.getByText('https://github.com/openai/openai')).toBeTruthy();
  });

  it('제목 링크 variant는 favicon과 title만 간결하게 렌더링한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          description: 'Repository description',
          favicon: 'https://github.com/favicon.ico',
          image: 'https://opengraph.githubassets.com/image.png',
          siteName: 'GitHub',
          title: 'openai/openai',
          url: 'https://github.com/openai/openai',
        }),
        ok: true,
      }),
    );

    render(<LinkEmbedCard url="https://github.com/openai/openai" variant="preview" />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'openai/openai' })).toBeTruthy();
    });

    expect(screen.queryByText('Repository description')).toBeNull();
    expect(screen.queryByText('https://github.com/openai/openai')).toBeNull();
  });

  it('OG 메타가 부족하면 일반 외부 링크로 fallback한다', async () => {
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

    render(<LinkEmbedCard fallbackLabel="Example" url="https://example.com" variant="card" />);

    const link = await screen.findByRole('link', { name: 'Example' });

    expect(link.getAttribute('href')).toBe('https://example.com/');
    expect(screen.queryByText('링크 정보를 불러오는 중...')).toBeNull();
  });
});
