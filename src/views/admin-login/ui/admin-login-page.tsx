import { useTranslations } from 'next-intl';

import { AdminLoginForm } from '@/features/auth/ui/admin-login-form';

type AdminLoginPageProps = {
  locale: string;
};

/**
 * 관리자 로그인 페이지의 locale별 텍스트를 조합합니다.
 */
export const AdminLoginPage = ({ locale }: AdminLoginPageProps) => {
  const t = useTranslations('AdminLogin');

  return (
    <AdminLoginForm
      description={t('description')}
      emailLabel={t('emailLabel')}
      emailPlaceholder={t('emailPlaceholder')}
      invalidCredentialsMessage={t('invalidCredentials')}
      passwordLabel={t('passwordLabel')}
      passwordPlaceholder={t('passwordPlaceholder')}
      submitErrorMessage={t('submitError')}
      submitLabel={t('submit')}
      submitPendingLabel={t('submitPending')}
      successRedirectPath={`/${locale}/guest`}
      title={t('title')}
    />
  );
};
