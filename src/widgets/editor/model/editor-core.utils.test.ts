import {
  createEmptyTranslations,
  formatSavedAtLabel,
  isEditorStateEqual,
  normalizeTagSlugs,
  validateEditorState,
} from '@/widgets/editor/model/editor-core.utils';

describe('editor-core utils', () => {
  it('내용만 있고 제목이 없는 locale은 invalid로 판단한다', () => {
    const translations = createEmptyTranslations();
    translations.ko.content = '본문';

    const result = validateEditorState(translations);

    expect(result.localeValidation.ko.hasContentWithoutTitle).toBe(true);
    expect(result.canSave).toBe(false);
  });

  it('제목과 본문이 모두 있으면 저장 가능하다', () => {
    const translations = createEmptyTranslations();
    translations.ko.title = '제목';
    translations.ko.content = '본문';

    const result = validateEditorState(translations);

    expect(result.localeValidation.ko.hasCompleteTranslation).toBe(true);
    expect(result.canSave).toBe(true);
  });

  it('모든 locale이 비어 있으면 저장할 수 없다', () => {
    const result = validateEditorState(createEmptyTranslations());

    expect(result.hasAnyCompleteTranslation).toBe(false);
    expect(result.canSave).toBe(false);
  });

  it('tags 순서만 달라지면 같은 상태로 본다', () => {
    const left = {
      dirty: false,
      slug: 'editor-core',
      tags: ['react', 'nextjs'],
      translations: createEmptyTranslations(),
    };
    const right = {
      dirty: false,
      slug: 'editor-core',
      tags: ['nextjs', 'react'],
      translations: createEmptyTranslations(),
    };

    expect(isEditorStateEqual(left, right)).toBe(true);
    expect(normalizeTagSlugs(['nextjs', 'react', 'react'])).toEqual(['nextjs', 'react']);
  });

  it('slug 또는 번역이 달라지면 다른 상태로 본다', () => {
    const baseTranslations = createEmptyTranslations();
    baseTranslations.ko.title = '원본';
    const nextTranslations = createEmptyTranslations();
    nextTranslations.ko.title = '변경';

    expect(
      isEditorStateEqual(
        {
          dirty: false,
          slug: 'same-slug',
          tags: [],
          translations: baseTranslations,
        },
        {
          dirty: false,
          slug: 'other-slug',
          tags: [],
          translations: baseTranslations,
        },
      ),
    ).toBe(false);

    expect(
      isEditorStateEqual(
        {
          dirty: false,
          slug: 'same-slug',
          tags: [],
          translations: baseTranslations,
        },
        {
          dirty: false,
          slug: 'same-slug',
          tags: [],
          translations: nextTranslations,
        },
      ),
    ).toBe(false);
  });

  it('저장 시각을 HH:MM으로 zero-pad 포맷한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T00:00:00.000Z'));

    expect(formatSavedAtLabel('2026-03-12T09:07:00+09:00')).toBe('09:07');
    vi.useRealTimers();
  });
});
