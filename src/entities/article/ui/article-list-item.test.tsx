import { render, screen } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import React from 'react';

import { ArticleListItem } from './article-list-item';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    key === 'viewArticle' ? `${values?.title} article detail` : key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    createElement('a', { href, ...props }, children),
}));

describe('ArticleListItem', () => {
  it('정확한 연월일 포맷으로 날짜를 렌더링한다', () => {
    render(
      <ArticleListItem
        article={{
          created_at: '2026-02-24T09:00:00+00:00',
          description: '설명',
          id: 'article-1',
          thumbnail_url: null,
          title: '제목',
        }}
      />,
    );

    expect(screen.getByText('2026. 02. 24')).toBeTruthy();
    expect(screen.getByRole('link', { name: '제목 article detail' })).toBeTruthy();
  });
});
