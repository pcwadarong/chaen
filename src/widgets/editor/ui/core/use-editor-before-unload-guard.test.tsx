import { cleanup, renderHook } from '@testing-library/react';

import { useEditorBeforeUnloadGuard } from '@/widgets/editor/ui/core/use-editor-before-unload-guard';

describe('useEditorBeforeUnloadGuard', () => {
  afterEach(() => {
    cleanup();
  });

  it('dirty 상태일 때 beforeunload를 막는다', () => {
    renderHook(() => useEditorBeforeUnloadGuard(true));

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('dirty가 false면 beforeunload를 막지 않는다', () => {
    renderHook(() => useEditorBeforeUnloadGuard(false));

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
