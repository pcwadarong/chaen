import { redirect } from 'next/navigation';
import { isValidElement } from 'react';
import { vi } from 'vitest';

import { getAdminEditorPageData } from '@/views/admin-editor';

import AdminEditorRoute, { metadata } from './page';

const { redirectError } = vi.hoisted(() => ({
  redirectError: {
    __next_redirect: true,
    destination: '/ko/admin/login',
  },
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(destination => {
    throw {
      ...redirectError,
      destination,
    };
  }),
}));

vi.mock('@/views/admin-editor', () => ({
  getAdminEditorPageData: vi.fn(),
  AdminEditorPage: function AdminEditorPage() {
    return null;
  },
}));

describe('AdminEditorRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('관리자 세션이 있으면 에디터 페이지를 렌더링한다', async () => {
    vi.mocked(getAdminEditorPageData).mockResolvedValue({
      availableTags: [],
      redirectPath: null,
    });

    const element = await AdminEditorRoute({
      params: Promise.resolve({
        locale: 'ko',
      }),
    });

    expect(isValidElement(element)).toBe(true);
    expect(element.type.name).toBe('AdminEditorPage');
    expect(element.props.availableTags).toEqual([]);
    expect(element.props.locale).toBe('ko');
  });

  it('관리자가 아니면 로그인 페이지로 리다이렉트한다', async () => {
    vi.mocked(getAdminEditorPageData).mockResolvedValue({
      availableTags: [],
      redirectPath: '/ko/admin/login',
    });

    await expect(
      AdminEditorRoute({
        params: Promise.resolve({
          locale: 'ko',
        }),
      }),
    ).rejects.toMatchObject({
      __next_redirect: true,
      destination: '/ko/admin/login',
    });

    expect(redirect).toHaveBeenCalledWith('/ko/admin/login');
  });

  it('관리자 에디터 페이지는 검색 엔진 색인을 비활성화한다', () => {
    expect(metadata.robots).toMatchObject({
      follow: false,
      index: false,
    });
  });
});
