import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ResumePublishPanel } from '@/widgets/resume-editor/ui/resume-publish-panel';

import '@testing-library/jest-dom/vitest';

const baseEditorState = {
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
};

const baseSettings = {
  downloadFileName: 'ParkChaewon-Resume.pdf',
  downloadPath: '/api/pdf/resume',
  filePath: 'ParkChaewon-Resume.pdf',
  isPdfReady: false,
};

describe('ResumePublishPanel', () => {
  it('PDF 업로드 성공 시 상태를 업로드됨으로 갱신한다', async () => {
    const onUploadPdf = vi.fn().mockResolvedValue({
      ...baseSettings,
      isPdfReady: true,
    });

    render(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={baseSettings}
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onUploadPdf={onUploadPdf}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { hidden: true, name: '이력서 게시 설정' }),
      ).toHaveAttribute('aria-hidden', 'false');
    });

    const fileInput = screen.getByLabelText('PDF 업로드', {
      selector: 'input',
    });

    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('file input not found');
    }

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('업로드됨')).toBeTruthy();
    });
  });

  it('pdf가 없으면 제출하지 않고 인라인 에러를 표시한다', async () => {
    const onSubmit = vi.fn();

    render(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={baseSettings}
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { hidden: true, name: '이력서 게시 설정' }),
      ).toHaveAttribute('aria-hidden', 'false');
    });

    fireEvent.click(screen.getByRole('button', { name: '게시하기' }));

    expect(await screen.findByText('이력서 PDF를 업로드해주세요')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
