import { useEffect } from 'react';

/**
 * dirty 상태일 때만 페이지 이탈 경고를 브라우저에 연결합니다.
 *
 * @param dirty 현재 편집 상태에 저장되지 않은 변경사항이 있는지 여부입니다.
 */
export const useEditorBeforeUnloadGuard = (dirty: boolean) => {
  useEffect(() => {
    if (!dirty || typeof window === 'undefined') return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dirty]);
};
