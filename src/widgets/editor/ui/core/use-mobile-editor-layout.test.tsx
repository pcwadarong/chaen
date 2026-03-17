import { act, renderHook } from '@testing-library/react';

import { useIsMobileEditorLayout } from '@/widgets/editor/ui/core/use-mobile-editor-layout';

type MatchMediaListener = (event: MediaQueryListEvent) => void;

describe('useIsMobileEditorLayout', () => {
  it('matchMedia 변경을 따라 모바일 여부를 갱신한다', () => {
    let listener: MatchMediaListener | null = null;
    let matches = false;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        addEventListener: (_event: string, nextListener: MatchMediaListener) => {
          listener = nextListener;
        },
        matches,
        media: '(max-width: 760px)',
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useIsMobileEditorLayout());

    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });
});
