import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { signInAdmin } from '@/features/admin-session/api/sign-in-admin';
import { AdminLoginForm } from '@/features/admin-session/ui/admin-login-form';

vi.mock('@/features/admin-session/api/sign-in-admin', () => ({
  signInAdmin: vi.fn(),
  initialSignInAdminState: {
    data: null,
    errorMessage: null,
    ok: false,
  },
}));

describe('AdminLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이메일과 비밀번호를 제출하면 Server Action을 호출한다', async () => {
    vi.mocked(signInAdmin).mockResolvedValue({
      data: null,
      errorMessage: null,
      ok: false,
    });

    render(<AdminLoginForm successRedirectPath="/ko/admin" />);

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'secret-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(signInAdmin).toHaveBeenCalledTimes(1);
    });

    const call = vi.mocked(signInAdmin).mock.calls[0];
    expect(call?.[1]).toBeInstanceOf(FormData);

    const submittedFormData = call?.[1] as FormData;
    expect(submittedFormData.get('email')).toBe('admin@example.com');
    expect(submittedFormData.get('password')).toBe('secret-password');
    expect(submittedFormData.get('redirectPath')).toBe('/ko/admin');
  });

  it('로그인 실패 시 에러 메시지를 노출한다', async () => {
    vi.mocked(signInAdmin).mockResolvedValue({
      data: null,
      errorMessage: '이메일 또는 비밀번호를 다시 확인해주세요.',
      ok: false,
    });

    render(<AdminLoginForm successRedirectPath="/ko/admin" />);

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(
        '이메일 또는 비밀번호를 다시 확인해주세요.',
      );
    });
  });
});
