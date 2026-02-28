import { isValidElement } from 'react';
import { vi } from 'vitest';

import ResumeRoute from './page';

vi.mock('@/views/resume', () => ({
  ResumePage: function ResumePage() {
    return null;
  },
}));

describe('ResumeRoute', () => {
  it('이력서 뷰 엔트리를 반환한다', () => {
    const element = ResumeRoute();

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('ResumePage');
  });
});
