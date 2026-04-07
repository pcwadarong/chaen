import type { EditorState } from '@/entities/editor/model/editor-types';
import {
  resolveResumePublishNavigationMode,
  submitResumeDraft,
  submitResumePublish,
} from '@/views/resume-editor/model/resume-editor-client-actions';

/**
 * resume editor 액션 어댑터 테스트에 사용할 기본 editor 상태를 만듭니다.
 */
const createEditorState = (): EditorState => ({
  dirty: true,
  slug: '',
  tags: [],
  translations: {
    en: { content: '', description: '', download_button_label: '', title: 'Resume' },
    fr: { content: '', description: '', download_button_label: '', title: 'CV' },
    ja: { content: '', description: '', download_button_label: '', title: '履歴書' },
    ko: {
      content: '한국어 본문',
      description: '한국어 설명',
      download_button_label: '',
      title: '이력서',
    },
  },
});

describe('resume-editor-client-actions', () => {
  it('draft 저장 시 resume 상태로 변환하고 다음 draftId를 반환한다', async () => {
    const onDraftSave = vi.fn().mockResolvedValue({
      draftId: 'draft-next',
      savedAt: '2026-03-25T09:00:00.000Z',
    });

    const result = await submitResumeDraft({
      draftId: null,
      onDraftSave,
      state: createEditorState(),
    });

    expect(onDraftSave).toHaveBeenCalledWith(
      {
        contents: {
          en: { body: '', description: '', title: 'Resume' },
          fr: { body: '', description: '', title: 'CV' },
          ja: { body: '', description: '', title: '履歴書' },
          ko: {
            body: '한국어 본문',
            description: '한국어 설명',
            title: '이력서',
          },
        },
        dirty: true,
      },
      null,
    );
    expect(result).toEqual({
      nextDraftId: 'draft-next',
      result: {
        draftId: 'draft-next',
        savedAt: '2026-03-25T09:00:00.000Z',
      },
    });
  });

  it('draft 저장 결과에 draftId가 없으면 기존 draftId를 nextDraftId로 사용한다', async () => {
    const onDraftSave = vi.fn().mockResolvedValue({
      savedAt: '2026-03-25T09:00:00.000Z',
    });

    const result = await submitResumeDraft({
      draftId: 'draft-current',
      onDraftSave,
      state: createEditorState(),
    });

    expect(result.nextDraftId).toBe('draft-current');
  });

  it('발행 시 resume 상태로 변환하고 redirect 경로를 추출한다', async () => {
    const onPublishSubmit = vi.fn().mockResolvedValue({
      redirectPath: '/admin/resume/edit',
    });

    const result = await submitResumePublish({
      draftId: 'draft-current',
      onPublishSubmit,
      state: createEditorState(),
    });

    expect(onPublishSubmit).toHaveBeenCalledWith(
      {
        contents: {
          en: { body: '', description: '', title: 'Resume' },
          fr: { body: '', description: '', title: 'CV' },
          ja: { body: '', description: '', title: '履歴書' },
          ko: {
            body: '한국어 본문',
            description: '한국어 설명',
            title: '이력서',
          },
        },
        dirty: true,
      },
      'draft-current',
    );
    expect(result).toEqual({
      redirectPath: '/admin/resume/edit',
      result: {
        redirectPath: '/admin/resume/edit',
      },
    });
  });

  it('draft 저장 callback 에러를 호출자에게 전파한다', async () => {
    const onDraftSave = vi.fn().mockRejectedValue(new Error('저장 실패'));

    await expect(
      submitResumeDraft({
        draftId: null,
        onDraftSave,
        state: createEditorState(),
      }),
    ).rejects.toThrow('저장 실패');
  });

  it('발행 callback 에러를 호출자에게 전파한다', async () => {
    const onPublishSubmit = vi.fn().mockRejectedValue(new Error('발행 실패'));

    await expect(
      submitResumePublish({
        draftId: 'draft-current',
        onPublishSubmit,
        state: createEditorState(),
      }),
    ).rejects.toThrow('발행 실패');
  });

  it('현재 경로와 발행 redirect 경로가 같으면 replace-refresh 모드를 반환한다', () => {
    expect(
      resolveResumePublishNavigationMode({
        currentPathname: '/admin/resume/edit',
        redirectPath: '/admin/resume/edit',
      }),
    ).toBe('replace-refresh');
  });

  it('현재 경로와 발행 redirect 경로가 다르면 push 모드를 반환한다', () => {
    expect(
      resolveResumePublishNavigationMode({
        currentPathname: '/admin/resume/edit',
        redirectPath: '/admin',
      }),
    ).toBe('push');
  });
});
