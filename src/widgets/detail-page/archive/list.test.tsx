import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { type DetailArchiveLinkItem, DetailArchiveList } from '@/widgets/detail-page/archive/list';

const linkRenderSpy = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    linkRenderSpy(href);

    return (
      <a href={typeof href === 'string' ? href : ''} {...props}>
        {children}
      </a>
    );
  },
}));

describe('DetailArchiveList', () => {
  beforeEach(() => {
    linkRenderSpy.mockClear();
  });

  it('같은 props로 다시 그리면 아카이브 링크를 다시 렌더링하지 않는다', () => {
    const items: DetailArchiveLinkItem[] = [
      {
        description: '설명',
        href: '/articles/article-1',
        isActive: true,
        title: '첫 글',
        yearText: '2026',
      },
      {
        description: '다른 설명',
        href: '/articles/article-2',
        isActive: false,
        title: '둘째 글',
        yearText: '2025',
      },
    ];

    const rendered = render(<DetailArchiveList emptyText="비어 있음" items={items} />);

    expect(linkRenderSpy).toHaveBeenCalledTimes(2);

    rendered.rerender(<DetailArchiveList emptyText="비어 있음" items={items} />);

    expect(linkRenderSpy).toHaveBeenCalledTimes(2);
  });
});
