import { render, screen } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import React from 'react';

import '@testing-library/jest-dom/vitest';

import { ArticleListItem } from './article-list-item';

type MockNextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  unoptimized?: boolean;
};

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    key === 'viewArticle' ? `${values?.title} article detail` : key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    createElement('a', { href, ...props }, children),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, fill: _fill, src, unoptimized: _unoptimized, ...props }: MockNextImageProps) =>
    createElement('img', { alt, src, ...props }),
}));

describe('ArticleListItem', () => {
  it('publish_at이 있으면 그 날짜와 slug 경로를 사용한다', () => {
    render(
      <ArticleListItem
        article={{
          description: '설명',
          id: 'article-1',
          publish_at: '2026-02-25T09:00:00+00:00',
          slug: 'article-slug',
          thumbnail_url: null,
          title: '제목',
        }}
      />,
    );

    expect(screen.getByText('2026-02-25')).toBeTruthy();
    expect(screen.getByRole('link', { name: '제목 article detail' })).toHaveAttribute(
      'href',
      '/articles/article-slug',
    );
  });

  it('썸네일 이미지는 링크가 이미 라벨을 가지므로 장식용 alt를 사용한다', () => {
    const { container } = render(
      <ArticleListItem
        article={{
          description: '설명',
          id: 'article-1',
          publish_at: '2026-02-25T09:00:00+00:00',
          slug: 'article-slug',
          thumbnail_url: 'https://example.com/thumbnail.png',
          title: '제목',
        }}
      />,
    );

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });
});
