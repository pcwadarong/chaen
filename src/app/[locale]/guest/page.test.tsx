import { isValidElement } from 'react';
import { vi } from 'vitest';

import GuestRoute from './page';

vi.mock('@/views/guest', () => ({
  GuestPage: function GuestPage() {
    return null;
  },
}));

describe('GuestRoute', () => {
  it('방명록 뷰 엔트리를 반환한다', () => {
    const element = GuestRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('GuestPage');
  });
});
