import { act, renderHook } from '@testing-library/react';

import { createEmptyTranslations } from '@/widgets/editor/ui/core/editor-core.utils';
import { useEditorLocaleState } from '@/widgets/editor/ui/core/use-editor-locale-state';

describe('useEditorLocaleState', () => {
  it('같은 값으로 갱신하면 translations 객체를 재사용한다', () => {
    const initialTranslations = createEmptyTranslations();
    const { result } = renderHook(() =>
      useEditorLocaleState({
        initialTranslations,
      }),
    );

    const previousTranslations = result.current.translations;

    act(() => {
      result.current.updateTranslationField('ko', 'title', '');
    });

    expect(result.current.translations).toBe(previousTranslations);
  });

  it('locale별 필드 값은 서로 독립적으로 유지된다', () => {
    const { result } = renderHook(() =>
      useEditorLocaleState({
        initialTranslations: createEmptyTranslations(),
      }),
    );

    act(() => {
      result.current.updateTranslationField('ko', 'title', '한국어 제목');
      result.current.updateTranslationField('en', 'title', 'English title');
    });

    expect(result.current.translations.ko.title).toBe('한국어 제목');
    expect(result.current.translations.en.title).toBe('English title');
  });

  it('locale 전환 시 직전 scrollTop을 저장하고 새 locale에서 복원한다', () => {
    const { result } = renderHook(() =>
      useEditorLocaleState({
        initialTranslations: createEmptyTranslations(),
      }),
    );

    const koTextarea = document.createElement('textarea');
    const enTextarea = document.createElement('textarea');

    result.current.textareaRefs.ko.current = koTextarea;
    result.current.textareaRefs.en.current = enTextarea;
    koTextarea.scrollTop = 120;

    act(() => {
      result.current.handleLocaleChange('en');
    });

    expect(result.current.activeLocale).toBe('en');

    act(() => {
      result.current.handleTextareaScroll('en', 48);
      result.current.handleLocaleChange('ko');
    });

    expect(koTextarea.scrollTop).toBe(120);
  });
});
