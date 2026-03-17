import type { Locale } from '@/widgets/editor/ui/core/editor-core.types';
import {
  rememberTextareaScroll,
  resizeTextareaToContent,
} from '@/widgets/editor/ui/core/editor-core-textarea';

describe('editor-core textarea helpers', () => {
  it('textarea 높이를 scrollHeight 기준으로 다시 계산한다', () => {
    const textarea = document.createElement('textarea');

    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: 128,
    });

    resizeTextareaToContent(textarea);

    expect(textarea.style.height).toBe('128px');
  });

  it('locale별 scrollTop을 ref에 저장한다', () => {
    const koTextarea = document.createElement('textarea');
    koTextarea.scrollTop = 96;

    const scrollTopByLocaleRef = {
      current: { en: 0, fr: 0, ja: 0, ko: 0 },
    } as { current: Record<Locale, number> };
    const textareaRefs = {
      en: { current: null },
      fr: { current: null },
      ja: { current: null },
      ko: { current: koTextarea },
    } satisfies Record<Locale, { current: HTMLTextAreaElement | null }>;

    rememberTextareaScroll('ko', scrollTopByLocaleRef, textareaRefs);

    expect(scrollTopByLocaleRef.current.ko).toBe(96);
  });
});
