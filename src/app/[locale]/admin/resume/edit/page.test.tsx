import { isValidElement } from 'react';

import { getResumeEditorSeed } from '@/entities/resume/api/resume-editor-read';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

import AdminResumeEditRoute, { metadata } from './page';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/resume/api/resume-editor-read', () => ({
  getResumeEditorSeed: vi.fn(),
}));

vi.mock('@/views/resume-editor', () => ({
  ResumeEditorPage: function ResumeEditorPage() {
    return null;
  },
}));

describe('AdminResumeEditRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resume 전용 편집 페이지를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getResumeEditorSeed).mockResolvedValue({
      initialContents: {
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
          body: '',
          description: '',
          download_button_label: '다운로드',
          download_unavailable_label: '준비 중',
          title: '이력서',
        },
      },
      initialPublishSettings: {
        downloadFileName: 'ParkChaewon-Resume.pdf',
        downloadPath: '/api/pdf/resume',
        filePath: 'ParkChaewon-Resume.pdf',
        isPdfReady: false,
      },
      initialSavedAt: '2026-03-12T00:00:00.000Z',
    });

    const element = await AdminResumeEditRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(getResumeEditorSeed).toHaveBeenCalledTimes(1);
  });

  it('검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
