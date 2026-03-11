import { getAllTags } from '@/entities/tag/api/query-tags';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

type GetAdminEditorPageDataInput = {
  locale: string;
};

type AdminEditorPageData = {
  availableTags: {
    id: string;
    slug: string;
  }[];
  redirectPath: string | null;
};

/**
 * 관리자 에디터 진입 시 세션과 전체 태그 목록을 함께 준비합니다.
 */
export const getAdminEditorPageData = async ({
  locale,
}: GetAdminEditorPageDataInput): Promise<AdminEditorPageData> => {
  const authState = await getServerAuthState();

  if (!authState.isAdmin) {
    return {
      availableTags: [],
      redirectPath: `/${locale}/admin/login`,
    };
  }

  const allTags = await getAllTags();

  return {
    availableTags: allTags.data,
    redirectPath: null,
  };
};
