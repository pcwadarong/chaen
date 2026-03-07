import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { signOutAdmin } from '@/features/auth/api/sign-out-admin';

import { AdminSignOutButton } from './admin-sign-out-button';

const replaceMock = vi.fn();

vi.mock('@/features/auth/api/sign-out-admin', () => ({
  signOutAdmin: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe('AdminSignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그아웃 성공 시 로그인 페이지로 이동한다', async () => {
    vi.mocked(signOutAdmin).mockResolvedValue(undefined);

    render(
      <AdminSignOutButton
        errorMessage="로그아웃에 실패했습니다."
        redirectPath="/admin/login"
        submitLabel="로그아웃"
        submitPendingLabel="로그아웃 중"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => {
      expect(signOutAdmin).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('로그아웃 실패 시 에러를 노출한다', async () => {
    vi.mocked(signOutAdmin).mockRejectedValue(new Error('sign out failed'));

    render(
      <AdminSignOutButton
        errorMessage="로그아웃에 실패했습니다."
        redirectPath="/admin/login"
        submitLabel="로그아웃"
        submitPendingLabel="로그아웃 중"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('로그아웃에 실패했습니다.');
      expect(replaceMock).not.toHaveBeenCalled();
    });
  });
});
