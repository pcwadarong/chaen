import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ResumeEditorClient } from '@/views/resume-editor/ui/resume-editor-client';
import type { ResumeEditorCoreProps } from '@/widgets/resume-editor/ui/resume-editor.types';

import '@testing-library/jest-dom/vitest';

const resumeEditorClientMockState = vi.hoisted(() => ({
  editorCoreRenderCount: 0,
  editorState: {
    contents: {
      en: {
        body: '',
        description: '',
        download_button_label: 'Download',
        title: 'Resume',
      },
      fr: {
        body: '',
        description: '',
        download_button_label: 'Telecharger',
        title: 'CV',
      },
      ja: {
        body: '',
        description: '',
        download_button_label: 'ダウンロード',
        title: '履歴書',
      },
      ko: {
        body: '한국어 본문',
        description: '한국어 설명',
        download_button_label: '다운로드',
        title: '이력서',
      },
    },
    dirty: true,
  },
  lastOnPublish: undefined as ResumeEditorCoreProps['onPublish'] | undefined,
}));

vi.mock('@/widgets/resume-editor', async () => {
  const actual = await vi.importActual('@/widgets/resume-editor');

  return {
    ...actual,
    ResumeEditorCore: ({ hideAppFrameFooter, onPublish }: ResumeEditorCoreProps) => {
      resumeEditorClientMockState.editorCoreRenderCount += 1;
      resumeEditorClientMockState.lastOnPublish = onPublish;

      return (
        <div data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}>
          <button
            onClick={() => onPublish?.(resumeEditorClientMockState.editorState)}
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
    resumeEditorClientMockState.lastOnPublish = undefined;
  });

  it('발행하기 버튼 클릭 시 현재 editor 상태로 서버 발행 callback을 호출한다', async () => {
    const onPublishSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResumeEditorClient
        initialContents={resumeEditorClientMockState.editorState.contents}
        onPublishSubmit={onPublishSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(onPublishSubmit).toHaveBeenCalledWith(resumeEditorClientMockState.editorState, null);
    });
  });

  it('발행 버튼 클릭으로 resume editor core를 다시 그리지 않는다', async () => {
    const onPublishSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResumeEditorClient
        initialContents={resumeEditorClientMockState.editorState.contents}
        onPublishSubmit={onPublishSubmit}
      />,
    );

    expect(resumeEditorClientMockState.editorCoreRenderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(onPublishSubmit).toHaveBeenCalledTimes(1);
    });

    expect(resumeEditorClientMockState.editorCoreRenderCount).toBe(1);
  });

  it('hideAppFrameFooter를 resume editor core까지 전달한다', () => {
    const { container } = render(
      <ResumeEditorClient
        hideAppFrameFooter
        initialContents={resumeEditorClientMockState.editorState.contents}
      />,
    );

    expect(container.querySelector('[data-hide-app-frame-footer="true"]')).toBeTruthy();
  });

  it('onPublishSubmit이 없으면 resume editor core에 onPublish를 넘기지 않는다', () => {
    render(
      <ResumeEditorClient initialContents={resumeEditorClientMockState.editorState.contents} />,
    );

    expect(resumeEditorClientMockState.lastOnPublish).toBeUndefined();
  });
});
