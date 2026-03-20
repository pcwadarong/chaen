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
        download_unavailable_label: 'Preparing',
        title: 'Resume',
      },
      fr: {
        body: '',
        description: '',
        download_button_label: 'Telecharger',
        download_unavailable_label: 'Preparation',
        title: 'CV',
      },
      ja: {
        body: '',
        description: '',
        download_button_label: 'ダウンロード',
        download_unavailable_label: '準備中',
        title: '履歴書',
      },
      ko: {
        body: '한국어 본문',
        description: '한국어 설명',
        download_button_label: '다운로드',
        download_unavailable_label: '준비 중',
        title: '이력서',
      },
    },
    dirty: true,
  },
}));

vi.mock('@/widgets/resume-editor', async () => {
  const actual = await vi.importActual('@/widgets/resume-editor');

  return {
    ...actual,
    ResumeEditorCore: ({
      hideAppFrameFooter,
      initialPublishSettings,
      onPublish,
    }: ResumeEditorCoreProps) => {
      resumeEditorClientMockState.editorCoreRenderCount += 1;

      return (
        <div data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}>
          <button
            onClick={() =>
              onPublish?.(resumeEditorClientMockState.editorState, initialPublishSettings)
            }
            type="button"
          >
            발행하기
          </button>
        </div>
      );
    },
  };
});

const basePublishSettings = {
  downloadFileName: 'ParkChaewon-Resume-en.pdf',
  downloadPath: '/api/pdf/resume',
  filePath: 'ParkChaewon-Resume-en.pdf',
  isPdfReady: false,
};

describe('ResumeEditorClient', () => {
  beforeEach(() => {
    resumeEditorClientMockState.editorCoreRenderCount = 0;
  });

  it('발행하기 버튼 클릭 시 현재 editor 상태와 publish settings로 서버 발행 callback을 호출한다', async () => {
    const onPublishSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResumeEditorClient
        initialContents={resumeEditorClientMockState.editorState.contents}
        initialPublishSettings={basePublishSettings}
        onPublishSubmit={onPublishSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(onPublishSubmit).toHaveBeenCalledWith(
        basePublishSettings,
        resumeEditorClientMockState.editorState,
        null,
      );
    });
  });

  it('발행 버튼 클릭으로 resume editor core를 다시 그리지 않는다', async () => {
    const onPublishSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResumeEditorClient
        initialContents={resumeEditorClientMockState.editorState.contents}
        initialPublishSettings={basePublishSettings}
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
        initialPublishSettings={basePublishSettings}
      />,
    );

    expect(container.querySelector('[data-hide-app-frame-footer="true"]')).toBeTruthy();
  });
});
