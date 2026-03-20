import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { createResumeEditorError } from '@/entities/resume/model/resume-editor-error';
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
  downloadFileName: 'ParkChaewon-Resume-en.pdf',
  downloadPath: '/api/pdf/resume',
  filePath: 'ParkChaewon-Resume-en.pdf',
  isPdfReady: false,
};

describe('ResumePublishPanel', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          isPdfReady: false,
          kind: 'resume',
        }),
        ok: true,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('rerender 이후 최신 onUploadPdf를 사용한다', async () => {
    const staleUploadPdf = vi.fn().mockRejectedValue(createResumeEditorError('pdfUploadFailed'));
    const nextUploadPdf = vi.fn().mockResolvedValue({
      ...baseSettings,
      isPdfReady: true,
    });
    const { rerender } = render(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={baseSettings}
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onUploadPdf={staleUploadPdf}
      />,
    );

    rerender(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={baseSettings}
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onUploadPdf={nextUploadPdf}
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
      expect(nextUploadPdf).toHaveBeenCalledTimes(1);
      expect(screen.getByText('업로드됨')).toBeTruthy();
    });

    expect(staleUploadPdf).not.toHaveBeenCalled();
  });

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

  it('열린 상태에서 initialSettings가 바뀌어도 현재 로컬 설정을 덮어쓰지 않고 재오픈 시 최신 초기값을 읽는다', async () => {
    const uploadedSettings = {
      ...baseSettings,
      downloadFileName: 'Uploaded-Resume.pdf',
      isPdfReady: true,
    };
    const reopenedSettings = {
      ...baseSettings,
      downloadFileName: 'Reopened-Resume.pdf',
      isPdfReady: false,
    };
    const onUploadPdf = vi.fn().mockResolvedValue(uploadedSettings);
    const { rerender } = render(
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
      expect(screen.getByText('Uploaded-Resume.pdf')).toBeTruthy();
      expect(screen.getByText('업로드됨')).toBeTruthy();
    });

    rerender(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={reopenedSettings}
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onUploadPdf={onUploadPdf}
      />,
    );

    expect(screen.getByText('Uploaded-Resume.pdf')).toBeTruthy();
    expect(screen.getByText('업로드됨')).toBeTruthy();

    rerender(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={reopenedSettings}
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onUploadPdf={onUploadPdf}
      />,
    );

    rerender(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={reopenedSettings}
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onUploadPdf={onUploadPdf}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Reopened-Resume.pdf')).toBeTruthy();
      expect(screen.getByText('PDF 업로드 필요')).toBeTruthy();
    });
  });

  it('PDF 업로드 실패 토스트를 닫을 수 있다', async () => {
    const onUploadPdf = vi.fn().mockRejectedValue(createResumeEditorError('pdfUploadFailed'));

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
      expect(
        screen.getAllByText('이력서 PDF 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'),
      ).toHaveLength(2);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(
        screen.getAllByText('이력서 PDF 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'),
      ).toHaveLength(1);
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

    const inlineError = await screen.findByRole('alert');

    expect(inlineError).toHaveTextContent('이력서 PDF를 업로드해주세요');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('게시 중 한국어 제목 오류가 오면 인라인 에러로 표시한다', async () => {
    const onSubmit = vi.fn().mockRejectedValue(createResumeEditorError('missingKoTitle'));

    render(
      <ResumePublishPanel
        editorState={baseEditorState}
        initialSettings={{
          ...baseSettings,
          isPdfReady: true,
        }}
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

    const inlineError = await screen.findByRole('alert');

    expect(inlineError).toHaveTextContent('한국어 제목을 입력해주세요');
  });
});
