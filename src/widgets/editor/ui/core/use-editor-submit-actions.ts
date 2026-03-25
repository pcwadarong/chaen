import { useCallback, useEffect, useRef, useState } from 'react';

import { EDITOR_ERROR_MESSAGE, parseEditorError } from '@/entities/editor/model/editor-error';
import type { EditorState } from '@/widgets/editor/ui/core/editor-core.types';
import {
  buildEditorStateSnapshot,
  createSaveErrorToast,
  resolveSavedAt,
  shouldScheduleEditorAutosave,
} from '@/widgets/editor/ui/core/editor-core-state';

const AUTOSAVE_DELAY_MS = 180_000;

type SaveSource = 'autosave' | 'manual';

type UseEditorSubmitActionsParams = {
  currentState: Pick<EditorState, 'dirty' | 'slug' | 'tags' | 'translations'>;
  enableAutosave: boolean;
  initialSavedAt?: string | null;
  onDirectPublish?: (state: EditorState) => Promise<void> | void;
  onDirectPublishError?: (error: unknown) => string;
  onDraftSave?: (state: EditorState) => Promise<{ savedAt?: string | null } | void>;
  onOpenPublishPanel?: (state: EditorState) => void;
  onSavedStateChange: (state: EditorState) => void;
  pushToast: (item: ReturnType<typeof createSaveErrorToast>) => void;
  validationCanSave: boolean;
};

type UseEditorSubmitActionsResult = {
  handleManualSave: () => void;
  handlePublishAction: () => Promise<void>;
  isPublishingDirectly: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
};

/**
 * EditorCore의 draft save, autosave, publish 오케스트레이션을 관리합니다.
 *
 * @param currentState 현재 편집 셸이 만든 snapshot 원본 상태입니다.
 * @param enableAutosave autosave 허용 여부입니다.
 * @param initialSavedAt 초기 저장 시각입니다.
 * @param onDirectPublish 직접 발행 callback입니다.
 * @param onDirectPublishError 직접 발행 실패 시 사용자 메시지 변환기입니다.
 * @param onDraftSave draft 저장 callback입니다.
 * @param onOpenPublishPanel publish panel 열기 callback입니다.
 * @param onSavedStateChange 저장 성공 후 parent에 반영할 상태 업데이트 함수입니다.
 * @param pushToast 저장/발행 실패 토스트 enqueue 함수입니다.
 * @param validationCanSave 현재 상태가 저장 가능한지 여부입니다.
 * @returns 저장/발행 실행 핸들러와 진행 상태를 반환합니다.
 */
export const useEditorSubmitActions = ({
  currentState,
  enableAutosave,
  initialSavedAt = null,
  onDirectPublish,
  onDirectPublishError,
  onDraftSave,
  onOpenPublishPanel,
  onSavedStateChange,
  pushToast,
  validationCanSave,
}: UseEditorSubmitActionsParams): UseEditorSubmitActionsResult => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishingDirectly, setIsPublishingDirectly] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialSavedAt);
  const saveRequestIdRef = useRef(0);

  /**
   * 현재 편집 상태가 저장 가능한지 확인하고, 실패 시 필요한 피드백을 적용합니다.
   */
  const ensureSavable = useCallback(
    (source: SaveSource) => {
      if (validationCanSave) return true;

      if (source === 'manual') {
        pushToast(
          createSaveErrorToast(`저장하려면 ${EDITOR_ERROR_MESSAGE.missingCompleteTranslation}`),
        );
      }

      return false;
    },
    [pushToast, validationCanSave],
  );

  /**
   * manual/autosave 모두 같은 저장 경로를 사용합니다.
   */
  const runDraftSave = useCallback(
    async (source: SaveSource) => {
      if (!onDraftSave || !ensureSavable(source)) return;

      const requestId = ++saveRequestIdRef.current;
      const requestState = buildEditorStateSnapshot(currentState);

      setIsSaving(true);

      try {
        const result = await onDraftSave(requestState);

        if (saveRequestIdRef.current !== requestId) return;

        onSavedStateChange({ ...requestState, dirty: false });
        setLastSavedAt(resolveSavedAt(result));
      } catch (error) {
        if (saveRequestIdRef.current !== requestId) return;

        const parsedError = parseEditorError(error, 'draftSaveFailed');
        pushToast(createSaveErrorToast(parsedError.message));
      } finally {
        if (saveRequestIdRef.current === requestId) {
          setIsSaving(false);
        }
      }
    },
    [currentState, ensureSavable, onDraftSave, onSavedStateChange, pushToast],
  );

  /**
   * autosave 기준을 만족하면 마지막 입력 후 180초 뒤 draft save를 실행합니다.
   */
  useEffect(() => {
    if (
      !shouldScheduleEditorAutosave({
        canSave: validationCanSave,
        dirty: currentState.dirty,
        enableAutosave,
        hasDraftSaveHandler: Boolean(onDraftSave),
      })
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void runDraftSave('autosave');
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentState.dirty, enableAutosave, onDraftSave, runDraftSave, validationCanSave]);

  const handleManualSave = useCallback(() => {
    void runDraftSave('manual');
  }, [runDraftSave]);

  /**
   * 현재 snapshot을 기준으로 direct publish 또는 panel open 경로를 선택합니다.
   */
  const handlePublishAction = useCallback(async () => {
    const snapshot = buildEditorStateSnapshot(currentState);

    if (onDirectPublish) {
      if (!ensureSavable('manual')) return;

      setIsPublishingDirectly(true);

      try {
        await onDirectPublish(snapshot);
      } catch (error) {
        pushToast(
          createSaveErrorToast(
            onDirectPublishError
              ? onDirectPublishError(error)
              : parseEditorError(error, 'publishFailed').message,
          ),
        );
      } finally {
        setIsPublishingDirectly(false);
      }

      return;
    }

    onOpenPublishPanel?.(snapshot);
  }, [
    currentState,
    ensureSavable,
    onDirectPublish,
    onDirectPublishError,
    onOpenPublishPanel,
    pushToast,
  ]);

  return {
    handleManualSave,
    handlePublishAction,
    isPublishingDirectly,
    isSaving,
    lastSavedAt,
  };
};
