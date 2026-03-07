import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { signInAdmin } from '@/features/auth/api/sign-in-admin';

import { AdminLoginForm } from './admin-login-form';

const replaceMock = vi.fn();

vi.mock('@/features/auth/api/sign-in-admin', () => ({
  signInAdmin: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe('AdminLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이메일과 비밀번호를 제출하면 로그인 후 guest로 이동한다', async () => {
    vi.mocked(signInAdmin).mockResolvedValue(undefined);

    render(
      <AdminLoginForm
        description="관리자 전용 로그인"
        emailLabel="이메일"
        emailPlaceholder="admin@example.com"
        invalidCredentialsMessage="로그인 정보를 확인해주세요."
        passwordLabel="비밀번호"
        passwordPlaceholder="비밀번호"
        submitLabel="로그인"
        submitPendingLabel="로그인 중"
        submitErrorMessage="로그인에 실패했습니다."
        successRedirectPath="/ko/guest"
        title="관리자 로그인"
      />,
    );

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'secret-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(signInAdmin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'secret-password',
      });
      expect(replaceMock).toHaveBeenCalledWith('/ko/guest');
    });
  });

  it('로그인 실패 시 에러 메시지를 노출한다', async () => {
    vi.mocked(signInAdmin).mockRejectedValue(new Error('invalid credentials'));

    render(
      <AdminLoginForm
        description="관리자 전용 로그인"
        emailLabel="이메일"
        emailPlaceholder="admin@example.com"
        invalidCredentialsMessage="로그인 정보를 확인해주세요."
        passwordLabel="비밀번호"
        passwordPlaceholder="비밀번호"
        submitLabel="로그인"
        submitPendingLabel="로그인 중"
        submitErrorMessage="로그인에 실패했습니다."
        successRedirectPath="/ko/guest"
        title="관리자 로그인"
      />,
    );

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('로그인 정보를 확인해주세요.');
      expect(replaceMock).not.toHaveBeenCalled();
    });
  });
});
