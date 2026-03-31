/* @vitest-environment node */

import { isValidElement } from 'react';

import AdminResumeRoute, { metadata } from '@/app/[locale]/admin/resume/page';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import { getAdminPdfUploadItems } from '@/widgets/admin-pdf-upload/model/get-admin-pdf-upload-items';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/widgets/admin-pdf-upload/model/get-admin-pdf-upload-items', () => ({
  getAdminPdfUploadItems: vi.fn(),
}));

vi.mock('@/views/admin-resume', () => ({
  AdminResumePage: function AdminResumePage() {
    return null;
  },
}));

describe('AdminResumeRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('유효한 관리자 인증 상태에서, AdminResumeRoute는 PDF 업로드 항목만 전달해야 한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(getAdminPdfUploadItems).mockResolvedValue([
      {
        assetKey: 'resume-ko',
        downloadFileName: 'ParkChaewon-Resume-ko.pdf',
        downloadPath: '/api/pdf/file/resume-ko',
        filePath: 'pdf/ParkChaewon-Resume-ko.pdf',
        isPdfReady: false,
        title: '이력서 PDF (KO)',
      },
    ]);

    const element = await AdminResumeRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(getAdminPdfUploadItems).toHaveBeenCalledTimes(1);
    expect(element.props.signOutRedirectPath).toBe('/ko/admin/login');
  });

  it('모든 조건에서, metadata는 검색 엔진 색인을 비활성화해야 한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
