import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ResumeEditorClient } from '@/views/resume-editor/ui/resume-editor-client';
import type { EditorCoreProps } from '@/widgets/editor';

import '@testing-library/jest-dom/vitest';

const RESUME_EDITOR_CLIENT_TEST_TIMEOUT_MS = 10_000;

const toResumeInitialContents = () => ({
  en: {
    body: '',
    description: '',
    title: 'Resume',
  },
  fr: {
    body: '',
    description: '',
    title: 'CV',
  },
  ja: {
    body: '',
    description: '',
    title: '履歴書',
  },
  ko: {
    body: '한국어 본문',
    description: '한국어 설명',
    title: '이력서',
  },
});

const resumeEditorClientMockState = vi.hoisted(() => ({
  editorCoreRenderCount: 0,
  editorState: {
    dirty: true,
    slug: '',
    tags: [],
    translations: {
      en: {
        content: '',
        description: '',
        title: 'Resume',
      },
      fr: {
        content: '',
        description: '',
        title: 'CV',
      },
      ja: {
        content: '',
        description: '',
        title: '履歴書',
      },
      ko: {
        content: '한국어 본문',
        description: '한국어 설명',
        title: '이력서',
      },
    },
  },
  lastExtraLocaleFieldLabel: undefined as EditorCoreProps['extraLocaleFieldLabel'] | undefined,
  lastOnDraftSave: undefined as EditorCoreProps['onDraftSave'] | undefined,
  lastOnDirectPublish: undefined as EditorCoreProps['onDirectPublish'] | undefined,
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: resumeEditorClientMockState.routerPush,
  }),
}));

vi.mock('@/widgets/editor', async () => {
  const actual = await vi.importActual('@/widgets/editor');

  return {
    ...actual,
    EditorCore: ({
      extraLocaleFieldLabel,
      hideAppFrameFooter,
      onDirectPublish,
      onDraftSave,
    }: EditorCoreProps) => {
      resumeEditorClientMockState.editorCoreRenderCount += 1;
      resumeEditorClientMockState.lastExtraLocaleFieldLabel = extraLocaleFieldLabel;
      resumeEditorClientMockState.lastOnDraftSave = onDraftSave;
      resumeEditorClientMockState.lastOnDirectPublish = onDirectPublish;

      return (
        <div data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}>
          <button
            onClick={() => void onDirectPublish?.(resumeEditorClientMockState.editorState)}
            type="button"
          >
            발행하기
          </button>
        </div>
      );
    },
  };
});

describe('ResumeEditorClient', () => {
  beforeEach(() => {
    resumeEditorClientMockState.editorCoreRenderCount = 0;
    resumeEditorClientMockState.lastExtraLocaleFieldLabel = undefined;
    resumeEditorClientMockState.lastOnDraftSave = undefined;
    resumeEditorClientMockState.lastOnDirectPublish = undefined;
    resumeEditorClientMockState.routerPush.mockReset();
  });

  it(
    '발행하기 버튼 클릭 시 현재 editor 상태로 서버 발행 callback을 호출한다',
    async () => {
      const onDraftSave = vi.fn().mockResolvedValue(undefined);
      const onPublishSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <ResumeEditorClient
          initialContents={toResumeInitialContents()}
          onDraftSave={onDraftSave}
          onPublishSubmit={onPublishSubmit}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

      await waitFor(() => {
        expect(onPublishSubmit).toHaveBeenCalledTimes(1);
        expect(onPublishSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            contents: expect.objectContaining({
              ko: expect.objectContaining({
                body: '한국어 본문',
                title: '이력서',
              }),
            }),
            dirty: true,
          }),
          null,
        );
      });
    },
    RESUME_EDITOR_CLIENT_TEST_TIMEOUT_MS,
  );

  it(
    '발행 버튼 클릭으로 resume editor core를 다시 그리지 않는다',
    async () => {
      const onDraftSave = vi.fn().mockResolvedValue(undefined);
      const onPublishSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <ResumeEditorClient
          initialContents={toResumeInitialContents()}
          onDraftSave={onDraftSave}
          onPublishSubmit={onPublishSubmit}
        />,
      );

      expect(resumeEditorClientMockState.editorCoreRenderCount).toBe(1);

      fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

      await waitFor(() => {
        expect(onPublishSubmit).toHaveBeenCalledTimes(1);
      });

      expect(resumeEditorClientMockState.editorCoreRenderCount).toBe(1);
    },
    RESUME_EDITOR_CLIENT_TEST_TIMEOUT_MS,
  );

  it('hideAppFrameFooter를 resume editor core까지 전달한다', () => {
    const { container } = render(
      <ResumeEditorClient
        hideAppFrameFooter
        initialContents={toResumeInitialContents()}
        onDraftSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(container.querySelector('[data-hide-app-frame-footer="true"]')).toBeTruthy();
  });

  it('onPublishSubmit이 없으면 resume editor core에 onPublish를 넘기지 않는다', () => {
    render(
      <ResumeEditorClient
        initialContents={toResumeInitialContents()}
        onDraftSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(resumeEditorClientMockState.lastOnDirectPublish).toBeUndefined();
  });

  it('resume editor core에는 항상 draft save callback을 넘긴다', () => {
    render(
      <ResumeEditorClient
        initialContents={toResumeInitialContents()}
        onDraftSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(typeof resumeEditorClientMockState.lastOnDraftSave).toBe('function');
  });

  it('resume editor는 extra locale field를 넘기지 않는다', () => {
    render(
      <ResumeEditorClient
        initialContents={toResumeInitialContents()}
        onDraftSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(resumeEditorClientMockState.lastExtraLocaleFieldLabel).toBeUndefined();
  });

  it(
    'resume 발행 성공 시 반환된 redirectPath로 이동한다',
    async () => {
      const onDraftSave = vi.fn().mockResolvedValue(undefined);
      const onPublishSubmit = vi.fn().mockResolvedValue({
        redirectPath: '/ko/admin/resume/edit',
      });

      render(
        <ResumeEditorClient
          initialContents={toResumeInitialContents()}
          onDraftSave={onDraftSave}
          onPublishSubmit={onPublishSubmit}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

      await waitFor(() => {
        expect(onPublishSubmit).toHaveBeenCalledTimes(1);
        expect(resumeEditorClientMockState.routerPush).toHaveBeenCalledWith(
          '/ko/admin/resume/edit',
        );
      });
    },
    RESUME_EDITOR_CLIENT_TEST_TIMEOUT_MS,
  );
});
