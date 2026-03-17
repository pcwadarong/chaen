import { buildAdminPath } from '@/features/admin-session';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

type GetLoginPageDataInput = {
  locale: string;
};

type LoginPageData = {
  redirectPath: string | null;
};

/**
 * 관리자 로그인 페이지 진입 시 세션 상태를 확인해 이미 로그인된 경우 리다이렉트 경로를 반환합니다.
 */
export const getLoginPageData = async ({
  locale,
}: GetLoginPageDataInput): Promise<LoginPageData> => {
  const authState = await getServerAuthState();

  if (authState.isAdmin) {
    return {
      redirectPath: buildAdminPath({ locale }),
    };
  }

  return {
    redirectPath: null,
  };
};
