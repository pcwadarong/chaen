import { createEmptyTranslations } from '@/widgets/editor/ui/core/editor-core.utils';
import {
  buildEditorStateSnapshot,
  createSaveErrorToast,
  resolveSavedAt,
} from '@/widgets/editor/ui/core/editor-core-state';

describe('editor-core state helpers', () => {
  it('snapshot은 누락된 locale 필드를 빈 값으로 채운다', () => {
    const snapshot = buildEditorStateSnapshot({
      dirty: true,
      slug: 'editor-core',
      tags: ['nextjs'],
      translations: {
        ...createEmptyTranslations(),
        ko: {
          content: '본문',
          description: '설명',
          download_button_label: '',
          title: '제목',
        },
      },
    });

    expect(snapshot.dirty).toBe(true);
    expect(snapshot.tags).toEqual(['nextjs']);
    expect(snapshot.translations.ko.title).toBe('제목');
    expect(snapshot.translations.en.title).toBe('');
    expect(snapshot.translations.fr.content).toBe('');
  });

  it('저장 실패 토스트는 error tone과 id를 가진다', () => {
    const toast = createSaveErrorToast('저장 실패');

    expect(toast.message).toBe('저장 실패');
    expect(toast.tone).toBe('error');
    expect(toast.id).toMatch(/^save-error-/);
  });

  it('savedAt이 없으면 현재 시각을 fallback으로 사용한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-17T12:34:56.000Z'));

    expect(resolveSavedAt(undefined)).toBe('2026-03-17T12:34:56.000Z');
    expect(resolveSavedAt({ savedAt: '2026-03-10T00:00:00.000Z' })).toBe(
      '2026-03-10T00:00:00.000Z',
    );

    vi.useRealTimers();
  });
});
