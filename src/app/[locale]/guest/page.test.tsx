import { isValidElement } from 'react';
import { vi } from 'vitest';

import GuestRoute, { metadata } from '@/app/[locale]/guest/page';
import { getGuestPageData } from '@/views/guest';

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

  it('방명록 페이지는 검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
