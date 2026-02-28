import { isValidElement } from 'react';
import { vi } from 'vitest';

import HomeRoute from './page';

vi.mock('@/views/home', () => ({
  HomePage: function HomePage() {
    return null;
  },
}));

describe('HomeRoute', () => {
  it('returns the home view entry', () => {
    const element = HomeRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('HomePage');
  });
});
