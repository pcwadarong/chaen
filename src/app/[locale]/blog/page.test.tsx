import { isValidElement } from 'react';
import { vi } from 'vitest';

import BlogRoute from './page';

vi.mock('@/views/blog', () => ({
  BlogPage: function BlogPage() {
    return null;
  },
}));

describe('BlogRoute', () => {
  it('블로그 뷰 엔트리를 반환한다', () => {
    const element = BlogRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('BlogPage');
  });
});
