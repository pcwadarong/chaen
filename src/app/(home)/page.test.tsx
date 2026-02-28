import { isValidElement } from 'react';

import HomeRoute from './page';

describe('HomeRoute', () => {
  it('returns the home view entry', () => {
    const element = HomeRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('HomePage');
  });
});
