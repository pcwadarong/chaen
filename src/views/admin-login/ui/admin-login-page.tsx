import { AdminLoginForm } from '@/features/auth/ui/admin-login-form';

type AdminLoginPageProps = {
  locale: string;
};

/**
 * 관리자 로그인 페이지를 렌더링합니다.
 */
export const AdminLoginPage = ({ locale }: AdminLoginPageProps) => (
  <AdminLoginForm successRedirectPath={`/${locale}/admin`} />
);
