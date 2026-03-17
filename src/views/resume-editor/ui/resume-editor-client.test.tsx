import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ResumeEditorClient } from '@/views/resume-editor/ui/resume-editor-client';
import type {
  ResumeEditorCoreProps,
  ResumePublishPanelProps,
} from '@/widgets/resume-editor/ui/resume-editor.types';

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
    ResumeEditorCore: ({ hideAppFrameFooter, onOpenPublishPanel }: ResumeEditorCoreProps) => {
      resumeEditorClientMockState.editorCoreRenderCount += 1;

      return (
        <div data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}>
          <button
            onClick={() => onOpenPublishPanel(resumeEditorClientMockState.editorState)}
            type="button"
          >
            게시하기
          </button>
        </div>
      );
    },
    ResumePublishPanel: ({ isOpen, onClose }: ResumePublishPanelProps) =>
      isOpen ? (
        <div aria-label="이력서 게시 설정" role="dialog">
          <button aria-label="이력서 게시 설정 닫기" onClick={onClose} type="button">
            닫기
          </button>
        </div>
      ) : null,
  };
});

const basePublishSettings = {
  downloadFileName: 'ParkChaewon-Resume.pdf',
  downloadPath: '/api/pdf/resume',
  filePath: 'ParkChaewon-Resume.pdf',
  isPdfReady: false,
};

describe('ResumeEditorClient', () => {
  beforeEach(() => {
    resumeEditorClientMockState.editorCoreRenderCount = 0;
  });

  it('게시하기 버튼 클릭 시 resume publish panel을 연다', async () => {
    render(
      <ResumeEditorClient
        initialContents={resumeEditorClientMockState.editorState.contents}
        initialPublishSettings={basePublishSettings}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '게시하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '이력서 게시 설정' })).toBeTruthy();
    });
  });

  it('publish panel 열기와 닫기로 resume editor core를 다시 그리지 않는다', async () => {
    render(
      <ResumeEditorClient
        initialContents={resumeEditorClientMockState.editorState.contents}
        initialPublishSettings={basePublishSettings}
      />,
    );

    expect(resumeEditorClientMockState.editorCoreRenderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '게시하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '이력서 게시 설정' })).toBeTruthy();
    });

    expect(resumeEditorClientMockState.editorCoreRenderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '이력서 게시 설정 닫기' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '이력서 게시 설정' })).toBeNull();
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
