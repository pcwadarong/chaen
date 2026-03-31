import { vi } from 'vitest';

import { GET } from '@/app/api/(files)/pdf/admin/availability/route';
import { getPdfFileAvailability } from '@/entities/pdf-file/api/get-pdf-file-availability';
import { listPdfFileAssetStorageConfigs } from '@/entities/pdf-file/model/config';
import { AdminAuthorizationError, requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  AdminAuthorizationError: class AdminAuthorizationError extends Error {},
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/pdf-file/api/get-pdf-file-availability', () => ({
  getPdfFileAvailability: vi.fn(),
}));

vi.mock('@/entities/pdf-file/model/config', () => ({
  listPdfFileAssetStorageConfigs: vi.fn(),
}));

describe('api/pdf/admin/availability route', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자면 자산별 준비 상태를 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(listPdfFileAssetStorageConfigs).mockReturnValue([
      {
        assetKey: 'resume-ko',
        bucket: 'resume',
        downloadFileName: 'ParkChaewon-Resume-ko.pdf',
        filePath: 'pdf/ParkChaewon-Resume-ko.pdf',
        kind: 'resume',
        locale: 'ko',
        title: '이력서 PDF · 국문',
      },
      {
        assetKey: 'portfolio-en',
        bucket: 'project',
        downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
        filePath: 'pdf/ParkChaewon-Portfolio-en.pdf',
        kind: 'portfolio',
        locale: 'en',
        title: '포트폴리오 PDF · 영문',
      },
    ]);
    vi.mocked(getPdfFileAvailability).mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [
        {
          assetKey: 'resume-ko',
          isPdfReady: false,
        },
        {
          assetKey: 'portfolio-en',
          isPdfReady: true,
        },
      ],
    });
  });

  it('일부 availability 조회가 실패해도 나머지 자산 상태를 반환한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(listPdfFileAssetStorageConfigs).mockReturnValue([
      {
        assetKey: 'resume-ko',
        bucket: 'resume',
        downloadFileName: 'ParkChaewon-Resume-ko.pdf',
        filePath: 'pdf/ParkChaewon-Resume-ko.pdf',
        kind: 'resume',
        locale: 'ko',
        title: '이력서 PDF · 국문',
      },
      {
        assetKey: 'portfolio-en',
        bucket: 'project',
        downloadFileName: 'ParkChaewon-Portfolio-en.pdf',
        filePath: 'pdf/ParkChaewon-Portfolio-en.pdf',
        kind: 'portfolio',
        locale: 'en',
        title: '포트폴리오 PDF · 영문',
      },
    ]);
    vi.mocked(getPdfFileAvailability)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(true);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [
        {
          assetKey: 'resume-ko',
          isPdfReady: false,
        },
        {
          assetKey: 'portfolio-en',
          isPdfReady: true,
        },
      ],
    });
  });

  it('관리자가 아니면 403을 반환한다', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthorizationError());

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'Forbidden',
    });
  });
});
