import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { signOutAdmin } from '@/features/admin-session/api/sign-out-admin';
import { AdminSignOutButton } from '@/features/admin-session/ui/admin-sign-out-button';

vi.mock('@/features/admin-session/api/sign-out-admin', () => ({
  signOutAdmin: vi.fn(),
  initialSignOutAdminState: {
    data: null,
    errorMessage: null,
    ok: false,
  },
}));

describe('AdminSignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그아웃 버튼 제출 시 Server Action을 호출한다', async () => {
    vi.mocked(signOutAdmin).mockResolvedValue({
      data: null,
      errorMessage: null,
      ok: false,
    });

    render(
      <AdminSignOutButton
        redirectPath="/ko/admin/login"
        submitLabel="로그아웃"
        submitPendingLabel="로그아웃 중"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => {
      expect(signOutAdmin).toHaveBeenCalledTimes(1);
    });

    const call = vi.mocked(signOutAdmin).mock.calls[0];
    expect(call?.[1]).toBeInstanceOf(FormData);
    expect((call?.[1] as FormData).get('redirectPath')).toBe('/ko/admin/login');
  });

  it('로그아웃 실패 시 에러를 노출한다', async () => {
    vi.mocked(signOutAdmin).mockResolvedValue({
      data: null,
      errorMessage: '로그아웃에 실패했습니다.',
      ok: false,
    });

    render(
      <AdminSignOutButton
        redirectPath="/ko/admin/login"
        submitLabel="로그아웃"
        submitPendingLabel="로그아웃 중"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('로그아웃에 실패했습니다.');
    });
  });
});
