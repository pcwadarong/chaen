import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

type GetAdminPageDataInput = {
  locale: string;
};

type AdminPageData = {
  redirectPath: string | null;
};

/**
 * 관리자 페이지 접근 시 현재 세션이 admin인지 확인하고 리다이렉트 여부를 결정합니다.
 */
export const getAdminPageData = async ({
  locale,
}: GetAdminPageDataInput): Promise<AdminPageData> => {
  const authState = await getServerAuthState();

  if (!authState.isAdmin) {
    return {
      redirectPath: `/${locale}/admin/login`,
    };
  }

  return {
    redirectPath: null,
  };
};
