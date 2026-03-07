import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleSearchForm } from '@/features/article-feed/ui/article-search-form';

const replaceMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/articles',
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe('ArticleSearchForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replaceMock.mockReset();
    useSearchParamsMock.mockReturnValue(new URLSearchParams('q=next'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('입력 변경 후 500ms debounce로 router.replace를 호출한다', () => {
    render(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchQuery="next"
        submitText="검색"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: '검색어 입력' }), {
      target: { value: 'react' },
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(replaceMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(replaceMock).toHaveBeenCalledWith('/articles?q=react');
  });

  it('URL searchParams가 바뀌면 input 값을 동기화한다', () => {
    const { rerender } = render(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchQuery=""
        submitText="검색"
      />,
    );

    useSearchParamsMock.mockReturnValue(new URLSearchParams('q=server'));

    rerender(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchQuery=""
        submitText="검색"
      />,
    );

    expect(screen.getByRole<HTMLInputElement>('searchbox', { name: '검색어 입력' }).value).toBe(
      'server',
    );
  });

  it('초기화 버튼은 즉시 입력과 URL 쿼리를 비운다', () => {
    render(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchQuery="next"
        submitText="검색"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(screen.getByRole<HTMLInputElement>('searchbox', { name: '검색어 입력' }).value).toBe('');
    expect(replaceMock).toHaveBeenCalledWith('/articles');
  });

  it('검색 href를 만들 때 기존 tag 파라미터는 제거한다', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tag=nextjs'));

    render(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchQuery=""
        submitText="검색"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: '검색어 입력' }), {
      target: { value: 'react' },
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(replaceMock).toHaveBeenCalledWith('/articles?q=react');
  });

  it('검색 버튼은 아이콘 버튼이지만 스크린리더 텍스트를 유지한다', () => {
    render(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchQuery="next"
        submitText="검색"
      />,
    );

    expect(screen.getByRole('button', { name: '검색' })).toBeTruthy();
  });

  it('submit-only 모드에서는 입력만으로는 이동하지 않고 제출 시에만 이동한다', () => {
    render(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchMode="submit-only"
        searchQuery="next"
        submitText="검색"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: '검색어 입력' }), {
      target: { value: 'react' },
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(replaceMock).not.toHaveBeenCalled();

    fireEvent.submit(screen.getByRole('search'));

    expect(replaceMock).toHaveBeenCalledWith('/articles?q=react');
  });

  it('pending 상태면 검색 중 상태를 보조기기에만 노출한다', () => {
    vi.spyOn(React, 'useTransition').mockReturnValue([true, callback => callback()]);

    render(
      <ArticleSearchForm
        clearText="초기화"
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchQuery="next"
        submitText="검색"
      />,
    );

    expect(screen.getByRole('status').textContent).toBe('검색 중');
    expect(screen.getByRole('search').getAttribute('aria-busy')).toBe('true');
  });
});
