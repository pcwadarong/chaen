import { isValidElement } from 'react';

import HomePage from './page';

describe('HomePage', () => {
  it('returns the bootstrap message', () => {
    const element = HomePage();

    expect(isValidElement(element)).toBe(true);
    expect(element.props.children).toBe('Project bootstrap is ready.');
  });
});
