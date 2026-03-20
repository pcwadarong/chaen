import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { ArticleSearchForm } from '@/features/article-search/ui/article-search-form';

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

  it('replace 직전에 pending 상태를 즉시 알린다', () => {
    const onPendingChange = vi.fn();

    render(
      <ArticleSearchForm
        clearText="초기화"
        onPendingChange={onPendingChange}
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
      vi.advanceTimersByTime(500);
    });

    expect(onPendingChange).toHaveBeenCalledWith(true);
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
    const onSubmitComplete = vi.fn();

    render(
      <ArticleSearchForm
        clearText="초기화"
        onSubmitComplete={onSubmitComplete}
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
    expect(onSubmitComplete).toHaveBeenCalledTimes(1);
  });

  it('현재 query와 같은 값을 제출하면 onSubmitComplete를 즉시 호출한다', () => {
    const onSubmitComplete = vi.fn();

    render(
      <ArticleSearchForm
        clearText="초기화"
        onSubmitComplete={onSubmitComplete}
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchMode="submit-only"
        searchQuery="next"
        submitText="검색"
      />,
    );

    fireEvent.submit(screen.getByRole('search'));

    expect(replaceMock).not.toHaveBeenCalled();
    expect(onSubmitComplete).toHaveBeenCalledTimes(1);
  });

  it('rerender 이후 최신 onSubmitComplete를 사용한다', () => {
    const staleOnSubmitComplete = vi.fn();
    const nextOnSubmitComplete = vi.fn();
    const { rerender } = render(
      <ArticleSearchForm
        clearText="초기화"
        onSubmitComplete={staleOnSubmitComplete}
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchMode="submit-only"
        searchQuery="next"
        submitText="검색"
      />,
    );

    rerender(
      <ArticleSearchForm
        clearText="초기화"
        onSubmitComplete={nextOnSubmitComplete}
        pendingText="검색 중"
        placeholder="검색어 입력"
        searchMode="submit-only"
        searchQuery="next"
        submitText="검색"
      />,
    );

    fireEvent.submit(screen.getByRole('search'));

    expect(replaceMock).not.toHaveBeenCalled();
    expect(staleOnSubmitComplete).not.toHaveBeenCalled();
    expect(nextOnSubmitComplete).toHaveBeenCalledTimes(1);
  });

  it('transition이 시작되면 pending 상태 변경을 바깥으로 알린다', () => {
    const onPendingChange = vi.fn();
    vi.spyOn(React, 'useTransition').mockReturnValue([false, callback => callback()]);

    render(
      <ArticleSearchForm
        clearText="초기화"
        onPendingChange={onPendingChange}
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
      vi.advanceTimersByTime(500);
    });

    expect(onPendingChange).toHaveBeenCalledWith(true);
  });
});
