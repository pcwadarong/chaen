import { render, screen } from '@testing-library/react';
import React from 'react';

import { LoginPage } from '@/views/auth/ui/login-page';

vi.mock('@/features/auth/ui/admin-login-form', () => ({
  AdminLoginForm: ({ successRedirectPath }: { successRedirectPath: string }) => (
    <div data-redirect-path={successRedirectPath}>관리자 로그인 폼</div>
  ),
}));

describe('LoginPage', () => {
  it('로그인 성공 후 이동 경로를 locale prefix가 포함된 관리자 경로로 전달한다', () => {
    render(<LoginPage locale="ko" />);

    expect(screen.getByText('관리자 로그인 폼').getAttribute('data-redirect-path')).toBe(
      '/ko/admin',
    );
  });
});
