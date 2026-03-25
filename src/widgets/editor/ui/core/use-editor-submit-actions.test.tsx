import { act, renderHook } from '@testing-library/react';

import { createEmptyTranslations } from '@/widgets/editor/ui/core/editor-core.utils';
import { useEditorSubmitActions } from '@/widgets/editor/ui/core/use-editor-submit-actions';

const AUTO_SAVE_DELAY_MS = 180_000;

const createCurrentState = (
  overrides?: Partial<{
    dirty: boolean;
    slug: string;
    tags: string[];
    title: string;
  }>,
) => ({
  dirty: overrides?.dirty ?? true,
  slug: overrides?.slug ?? '',
  tags: overrides?.tags ?? [],
  translations: {
    ...createEmptyTranslations(),
    ko: {
      content: '본문',
      description: '설명',
      download_button_label: '',
      title: overrides?.title ?? '제목',
    },
  },
});

describe('useEditorSubmitActions', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('manual save 성공 시 saved state를 갱신한다', async () => {
    const onDraftSave = vi.fn().mockResolvedValue({
      savedAt: '2026-03-25T09:00:00.000Z',
    });
    const onSavedStateChange = vi.fn();
    const pushToast = vi.fn();

    const { result } = renderHook(() =>
      useEditorSubmitActions({
        currentState: createCurrentState(),
        enableAutosave: true,
        onDraftSave,
        onSavedStateChange,
        pushToast,
        validationCanSave: true,
      }),
    );

    await act(async () => {
      result.current.handleManualSave();
    });

    expect(onDraftSave).toHaveBeenCalledTimes(1);
    expect(onSavedStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dirty: false,
        translations: expect.objectContaining({
          ko: expect.objectContaining({
            title: '제목',
          }),
        }),
      }),
    );
    expect(result.current.lastSavedAt).toBe('2026-03-25T09:00:00.000Z');
    expect(pushToast).not.toHaveBeenCalled();
  });

  it('autosave 조건을 만족하면 지연 후 draft save를 실행한다', async () => {
    vi.useFakeTimers();
    const onDraftSave = vi.fn().mockResolvedValue(undefined);
    const onSavedStateChange = vi.fn();

    renderHook(() =>
      useEditorSubmitActions({
        currentState: createCurrentState(),
        enableAutosave: true,
        onDraftSave,
        onSavedStateChange,
        pushToast: vi.fn(),
        validationCanSave: true,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS - 1);
    });
    expect(onDraftSave).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onDraftSave).toHaveBeenCalledTimes(1);
  });

  it('direct publish가 없으면 publish panel open callback을 호출한다', async () => {
    const onOpenPublishPanel = vi.fn();

    const { result } = renderHook(() =>
      useEditorSubmitActions({
        currentState: createCurrentState(),
        enableAutosave: true,
        onOpenPublishPanel,
        onSavedStateChange: vi.fn(),
        pushToast: vi.fn(),
        validationCanSave: true,
      }),
    );

    await act(async () => {
      await result.current.handlePublishAction();
    });

    expect(onOpenPublishPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        dirty: true,
      }),
    );
  });

  it('publish panel open callback에 dirty 여부와 현재 editor snapshot을 전달한다', async () => {
    const onOpenPublishPanel = vi.fn();

    const { result, rerender } = renderHook(
      ({ currentState }) =>
        useEditorSubmitActions({
          currentState,
          enableAutosave: true,
          onOpenPublishPanel,
          onSavedStateChange: vi.fn(),
          pushToast: vi.fn(),
          validationCanSave: true,
        }),
      {
        initialProps: {
          currentState: createCurrentState({
            dirty: false,
            tags: [],
            title: '',
          }),
        },
      },
    );

    await act(async () => {
      await result.current.handlePublishAction();
    });

    expect(onOpenPublishPanel).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        dirty: false,
        slug: '',
        tags: [],
        translations: expect.objectContaining({
          ko: expect.objectContaining({
            title: '',
          }),
        }),
      }),
    );

    rerender({
      currentState: createCurrentState({
        dirty: true,
        title: 'publish-title',
      }),
    });

    await act(async () => {
      await result.current.handlePublishAction();
    });

    expect(onOpenPublishPanel).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        dirty: true,
        slug: '',
        tags: [],
        translations: expect.objectContaining({
          ko: expect.objectContaining({
            title: 'publish-title',
          }),
        }),
      }),
    );
  });

  it('direct publish가 실패하면 토스트를 남긴다', async () => {
    const pushToast = vi.fn();
    const onDirectPublish = vi.fn().mockRejectedValue(new Error('publish failed'));

    const { result } = renderHook(() =>
      useEditorSubmitActions({
        currentState: createCurrentState(),
        enableAutosave: true,
        onDirectPublish,
        onSavedStateChange: vi.fn(),
        pushToast,
        validationCanSave: true,
      }),
    );

    await act(async () => {
      await result.current.handlePublishAction();
    });

    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'error',
      }),
    );
    expect(result.current.isPublishingDirectly).toBe(false);
  });

  it('manual save 불가 상태에서는 저장 대신 토스트를 남긴다', async () => {
    const pushToast = vi.fn();
    const onDraftSave = vi.fn();

    const { result } = renderHook(() =>
      useEditorSubmitActions({
        currentState: {
          ...createCurrentState(),
          dirty: true,
        },
        enableAutosave: true,
        onDraftSave,
        onSavedStateChange: vi.fn(),
        pushToast,
        validationCanSave: false,
      }),
    );

    await act(async () => {
      result.current.handleManualSave();
    });

    expect(onDraftSave).not.toHaveBeenCalled();
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'error',
      }),
    );
  });
});
