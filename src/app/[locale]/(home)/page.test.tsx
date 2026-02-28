import { isValidElement } from 'react';
import { vi } from 'vitest';

import HomeRoute from './page';

vi.mock('@/views/home', () => ({
  HomePage: function HomePage() {
    return null;
  },
}));

describe('HomeRoute', () => {
  it('홈 뷰 엔트리를 반환한다', () => {
    const element = HomeRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('HomePage');
  });
});
