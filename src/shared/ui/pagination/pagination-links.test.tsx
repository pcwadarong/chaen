import { render, screen } from '@testing-library/react';
import React from 'react';

import { PaginationLinks } from '@/shared/ui/pagination/pagination-links';

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('PaginationLinks', () => {
  it('이전/다음 링크가 모두 없으면 렌더링하지 않는다', () => {
    const { container } = render(
      <PaginationLinks
        ariaLabel="아티클 페이지 이동"
        nextHref={null}
        nextText="다음"
        previousHref={null}
        previousText="이전"
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('이전/다음 페이지 링크를 anchor로 렌더링한다', () => {
    render(
      <PaginationLinks
        ariaLabel="아티클 페이지 이동"
        nextHref="/ko/articles?page=3"
        nextText="다음"
        previousHref="/ko/articles"
        previousText="이전"
      />,
    );

    expect(screen.getByRole('navigation', { name: '아티클 페이지 이동' })).not.toBeNull();
    expect(screen.getByRole('link', { name: '이전' }).getAttribute('href')).toBe('/ko/articles');
    expect(screen.getByRole('link', { name: '다음' }).getAttribute('href')).toBe(
      '/ko/articles?page=3',
    );
  });
});
