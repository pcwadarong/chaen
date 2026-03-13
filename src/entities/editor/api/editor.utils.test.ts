import {
  buildDraftFieldRecord,
  buildDraftTranslations,
  buildEditorTranslationRows,
  mergeEditorSeedWithDraft,
  normalizeEditorVisibility,
} from '@/entities/editor/api/editor.utils';
import { createEmptyTranslations } from '@/widgets/editor/model/editor-core.utils';

describe('editor.utils', () => {
  it('draft json 필드를 locale 레코드로 만든다', () => {
    const translations = {
      ...createEmptyTranslations(),
      ko: { content: '본문', title: '제목' },
    };

    expect(buildDraftFieldRecord(translations, 'title')).toEqual({
      en: '',
      fr: '',
      ja: '',
      ko: '제목',
    });
    expect(buildDraftFieldRecord(translations, 'content')).toEqual({
      en: '',
      fr: '',
      ja: '',
      ko: '본문',
    });
  });

  it('draft json title/content를 editor translations로 복원한다', () => {
    expect(
      buildDraftTranslations({
        contentRecord: {
          en: 'Body',
          ko: '본문',
        },
        titleRecord: {
          en: 'Title',
          ko: '제목',
        },
      }),
    ).toEqual({
      en: { content: 'Body', title: 'Title' },
      fr: { content: '', title: '' },
      ja: { content: '', title: '' },
      ko: { content: '본문', title: '제목' },
    });
  });

  it('비어 있는 locale은 translation upsert 대상에서 제외한다', () => {
    const rows = buildEditorTranslationRows({
      contentId: 'article-1',
      foreignKey: 'article_id',
      translations: {
        ...createEmptyTranslations(),
        en: { content: '', title: 'English title' },
        ko: { content: '본문', title: '제목' },
      },
    });

    expect(rows).toEqual([
      {
        article_id: 'article-1',
        content: null,
        description: null,
        locale: 'en',
        title: 'English title',
      },
      {
        article_id: 'article-1',
        content: '본문',
        description: null,
        locale: 'ko',
        title: '제목',
      },
    ]);
  });

  it('draft seed를 기존 editor seed 위에 덮어쓴다', () => {
    const seed = {
      contentId: 'article-1',
      contentType: 'article' as const,
      initialPublished: true,
      initialSavedAt: '2026-03-13T00:00:00.000Z',
      initialSettings: {
        allowComments: true,
        publishAt: null,
        slug: 'published-slug',
        thumbnailUrl: '',
        visibility: 'public' as const,
      },
      initialSlug: 'published-slug',
      initialTags: ['react'],
      initialTranslations: createEmptyTranslations(),
    };

    expect(
      mergeEditorSeedWithDraft(seed, {
        allowComments: false,
        contentId: 'article-1',
        draftId: 'draft-1',
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'draft-slug',
        tags: ['nextjs'],
        thumbnailUrl: 'https://example.com/thumb.png',
        translations: {
          ...createEmptyTranslations(),
          ko: { content: '임시 본문', title: '임시 제목' },
        },
        updatedAt: '2026-03-14T09:00:00.000Z',
        visibility: 'draft',
      }),
    ).toEqual({
      contentId: 'article-1',
      contentType: 'article',
      initialDraftId: 'draft-1',
      initialPublished: false,
      initialSavedAt: '2026-03-14T09:00:00.000Z',
      initialSettings: {
        allowComments: false,
        publishAt: '2026-03-20T01:00:00.000Z',
        slug: 'draft-slug',
        thumbnailUrl: 'https://example.com/thumb.png',
        visibility: 'draft',
      },
      initialSlug: 'draft-slug',
      initialTags: ['nextjs'],
      initialTranslations: {
        en: { content: '', title: '' },
        fr: { content: '', title: '' },
        ja: { content: '', title: '' },
        ko: { content: '임시 본문', title: '임시 제목' },
      },
    });
  });

  it('visibility를 editor visibility 타입으로 정규화한다', () => {
    expect(normalizeEditorVisibility('public')).toBe('public');
    expect(normalizeEditorVisibility('private')).toBe('private');
    expect(normalizeEditorVisibility('draft')).toBe('draft');
    expect(normalizeEditorVisibility(null)).toBe('public');
  });
});
