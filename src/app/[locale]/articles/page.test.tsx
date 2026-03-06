import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getArticlesPageData } from '@/views/articles';

import ArticlesRoute from './page';

vi.mock('@/views/articles', () => ({
  getArticlesPageData: vi.fn(async () => ({
    initialCursor: null,
    initialItems: [],
    locale: 'ko',
    searchQuery: '',
  })),
  ArticlesPage: function ArticlesPage() {
    return null;
  },
}));

describe('ArticlesRoute', () => {
  it('아티클 뷰 엔트리와 아티클 목록 데이터를 반환한다', async () => {
    const element = await ArticlesRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
      searchParams: Promise.resolve({
        q: 'react',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ArticlesPage');
    expect(getArticlesPageData).toHaveBeenCalledWith({ locale: 'ko', query: 'react' });
    expect(element.props.initialItems).toEqual([]);
    expect(element.props.initialCursor).toBeNull();
    expect(element.props.locale).toBe('ko');
  });
});
