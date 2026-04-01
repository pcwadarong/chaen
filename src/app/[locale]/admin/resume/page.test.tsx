/* @vitest-environment node */

import { isValidElement } from 'react';

import AdminResumeRoute, { metadata } from '@/app/[locale]/admin/resume/page';
import { requireAdmin } from '@/shared/lib/auth/require-admin';
import type { AdminPdfUploadItem } from '@/widgets/admin-pdf-upload';
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

  it('유효한 관리자 인증 상태가 주어지면, AdminResumeRoute는 locale 기반 관리자 인증과 pdfUploadItems 전달 계약을 지켜야 한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    const pdfUploadItems: AdminPdfUploadItem[] = [
      {
        assetKey: 'resume-ko',
        downloadFileName: 'ParkChaewon-Resume-ko.pdf',
        downloadPath: '/api/pdf/file/resume-ko',
        filePath: 'pdf/ParkChaewon-Resume-ko.pdf',
        isPdfReady: false,
        title: '이력서 PDF (KO)',
      },
    ];
    vi.mocked(getAdminPdfUploadItems).mockReturnValue(pdfUploadItems);

    const element = await AdminResumeRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(requireAdmin).toHaveBeenCalledWith({ locale: 'ko' });
    expect(getAdminPdfUploadItems).toHaveBeenCalledTimes(1);
    expect(element.props.pdfUploadItems).toEqual(pdfUploadItems);
    expect(element.props.signOutRedirectPath).toBe('/ko/admin/login');
  });

  it('모든 조건에서, AdminResumeRoute metadata는 검색 엔진 색인을 비활성화해야 한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
