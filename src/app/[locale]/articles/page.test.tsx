import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getArticles } from '@/entities/article/api/get-articles';

import ArticlesRoute from './page';

vi.mock('@/entities/article/api/get-articles', () => ({
  getArticles: vi.fn(async () => ({
    items: [],
    nextCursor: null,
  })),
}));

vi.mock('@/views/articles', () => ({
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
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ArticlesPage');
    expect(getArticles).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.initialItems).toEqual([]);
    expect(element.props.initialCursor).toBeNull();
    expect(element.props.locale).toBe('ko');
  });
});
