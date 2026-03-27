import { isValidElement } from 'react';

import AdminPhotoRoute, { metadata } from '@/app/[locale]/admin/photo/page';
import { listPhotoFiles } from '@/entities/hero-photo/api/list-photo-files';
import { requireAdmin } from '@/shared/lib/auth/require-admin';

vi.mock('@/shared/lib/auth/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/entities/photo/api/list-photo-files', () => ({
  listPhotoFiles: vi.fn(),
}));

vi.mock('@/views/admin-photo', () => ({
  AdminPhotoPage: function AdminPhotoPage() {
    return null;
  },
}));

describe('AdminPhotoRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 사진 관리 페이지를 렌더링한다', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      isAdmin: true,
      isAuthenticated: true,
      userEmail: 'admin@example.com',
      userId: 'admin-id',
    });
    vi.mocked(listPhotoFiles).mockResolvedValue([
      {
        createdAt: '2026-03-27T09:00:00.000Z',
        fileName: 'first.jpg',
        filePath: 'first.jpg',
        mimeType: 'image/jpeg',
        publicUrl: 'https://example.com/first.jpg',
        size: 120_000,
      },
    ]);

    const element = await AdminPhotoRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(listPhotoFiles).toHaveBeenCalledTimes(1);
    expect(element.props.initialItems).toEqual([
      {
        createdAt: '2026-03-27T09:00:00.000Z',
        fileName: 'first.jpg',
        filePath: 'first.jpg',
        mimeType: 'image/jpeg',
        publicUrl: 'https://example.com/first.jpg',
        size: 120_000,
      },
    ]);
    expect(element.props.locale).toBe('ko');
  });

  it('검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
