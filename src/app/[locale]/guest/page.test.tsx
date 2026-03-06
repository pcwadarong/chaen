import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getGuestPageData } from '@/views/guest';

import GuestRoute from './page';

vi.mock('@/views/guest', () => ({
  getGuestPageData: vi.fn(),
  GuestPage: function GuestPage() {
    return null;
  },
}));

describe('GuestRoute', () => {
  it('방명록 뷰 엔트리와 초기 스레드 props를 반환한다', async () => {
    vi.mocked(getGuestPageData).mockResolvedValue({
      initialCursor: '12',
      initialItems: [],
    });

    const element = await GuestRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('GuestPage');
    expect(getGuestPageData).toHaveBeenCalledWith({ locale: 'ko' });
    expect(element.props.initialCursor).toBe('12');
  });
});
