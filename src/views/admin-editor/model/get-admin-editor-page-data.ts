import { getAllTags, getTagLabelMapBySlugs } from '@/entities/tag/api/query-tags';
import { buildAdminPath } from '@/shared/lib/auth/admin-path';
import { getServerAuthState } from '@/shared/lib/auth/get-server-auth-state';

type GetAdminEditorPageDataInput = {
  locale: string;
};

type AdminEditorPageData = {
  availableTags: {
    id: string;
    label: string;
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
      redirectPath: buildAdminPath({ locale, section: 'login' }),
    };
  }

  const allTags = await getAllTags();
  const tagLabelMap = await getTagLabelMapBySlugs({
    locale,
    slugs: allTags.data.map(tag => tag.slug),
  });

  return {
    availableTags: allTags.data.map(tag => ({
      ...tag,
      label: tagLabelMap.data.get(tag.slug) ?? tag.slug,
    })),
    redirectPath: null,
  };
};
