import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ResumeEditorClient } from '@/views/resume-editor/ui/resume-editor-client';

import '@testing-library/jest-dom/vitest';

const baseContents = {
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
};

const basePublishSettings = {
  downloadFileName: 'ParkChaewon-Resume.pdf',
  downloadPath: '/api/pdf/resume',
  filePath: 'ParkChaewon-Resume.pdf',
  isPdfReady: false,
};

describe('ResumeEditorClient', () => {
  it('게시하기 버튼 클릭 시 resume publish panel을 연다', async () => {
    render(
      <ResumeEditorClient
        initialContents={baseContents}
        initialPublishSettings={basePublishSettings}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '게시하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '이력서 게시 설정' })).toBeTruthy();
    });
  });
});
