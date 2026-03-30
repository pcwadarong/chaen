/* @vitest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { useHomeHeroProjectPreview } from '@/widgets/home-hero-scene/model/use-home-hero-project-preview';

const EMPTY_ITEMS: [] = [];

describe('useHomeHeroProjectPreview', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 프로젝트가 주어질 때, useHomeHeroProjectPreview는 추가 fetch 없이 초기 목록을 유지해야 한다', () => {
    const fetchSpy = vi.spyOn(window, 'fetch');

    const { result } = renderHook(() =>
      useHomeHeroProjectPreview({
        initialItems: [
          {
            description: 'description',
            id: 'project-1',
            period_end: null,
            period_start: null,
            publish_at: '2026-03-01T00:00:00.000Z',
            slug: 'project-1',
            thumbnail_url: null,
            title: 'Project 1',
          },
        ],
        locale: 'ko',
      }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.items).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('초기 프로젝트가 없을 때, useHomeHeroProjectPreview는 홈 프리뷰 프로젝트를 후속 조회해야 한다', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue({
      json: async () => ({
        items: [
          {
            description: 'description',
            id: 'project-1',
            period_end: null,
            period_start: null,
            publish_at: '2026-03-01T00:00:00.000Z',
            slug: 'project-1',
            thumbnail_url: null,
            title: 'Project 1',
          },
        ],
        nextCursor: null,
      }),
      ok: true,
    } as Response);

    const { result } = renderHook(() =>
      useHomeHeroProjectPreview({
        initialItems: EMPTY_ITEMS,
        locale: 'ko',
      }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(window.fetch).toHaveBeenCalledWith('/api/projects?limit=3&locale=ko', {
      signal: expect.any(AbortSignal),
    });
  });
});
