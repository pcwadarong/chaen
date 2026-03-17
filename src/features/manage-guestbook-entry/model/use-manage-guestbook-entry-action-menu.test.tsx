import { act, renderHook } from '@testing-library/react';

import { useManageGuestbookEntryActionMenu } from '@/features/manage-guestbook-entry/model/use-manage-guestbook-entry-action-menu';

describe('useManageGuestbookEntryActionMenu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coarse pointer 환경에서 long press로 메뉴를 연다', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        matches: query.includes('pointer: coarse'),
        media: query,
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() =>
      useManageGuestbookEntryActionMenu({
        enabled: true,
      }),
    );

    act(() => {
      result.current.longPressHandlers.onPointerDown?.({
        pointerType: 'touch',
      } as React.PointerEvent<HTMLElement>);
      vi.advanceTimersByTime(420);
    });

    expect(result.current.isOpen).toBe(true);
  });
});
