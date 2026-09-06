'use client';

import { useQuery } from '@tanstack/react-query';

import type { ProjectListItem, ProjectListPage } from '@/entities/project/model/types';
import type { AppLocale } from '@/i18n/routing';
import { projects } from '@/shared/lib/query/query-keys';

type UseHomeHeroProjectPreviewParams = Readonly<{
  initialItems?: ProjectListItem[];
  locale: string;
}>;

type UseHomeHeroProjectPreviewResult = Readonly<{
  isLoading: boolean;
  items: ProjectListItem[];
}>;

const EMPTY_PROJECT_ITEMS: ProjectListItem[] = [];
const HOME_HERO_PROJECT_PREVIEW_LIMIT = 3;

/**
 * 프로젝트 목록 API 응답이 홈 히어로 프리뷰 계약과 호환되는지 확인합니다.
 *
 * @param value `/api/projects` 응답 후보 값
 * @returns `items` 배열을 가진 프로젝트 페이지 응답이면 `true`
 */
const isProjectListPage = (value: unknown): value is ProjectListPage =>
  typeof value === 'object' && value !== null && 'items' in value && Array.isArray(value.items);

/**
 * 홈 히어로에서 사용할 프로젝트 프리뷰 3개를 후속 조회합니다.
 *
 * 프로젝트 카드는 스크롤 전환 또는 바텀 시트 열기 이후에야 실제로 보이므로 서버 첫
 * 렌더를 프로젝트 조회에 묶지 않고, 클라이언트 마운트 이후 React Query로 후속 조회해
 * 초기 장면 진입 속도를 우선 확보합니다. 서버가 시드를 넘겨준 경우에는 `enabled`를 꺼
 * 추가 조회 없이 시드를 그대로 사용하고, 조회에 실패하면 빈 목록을 노출합니다.
 *
 * hero photo도 같은 이유로 서버 첫 렌더를 막지 않습니다. 다만 그쪽은 service-role
 * storage 조회라 클라이언트에서 부를 수 없어, 서버가 요청만 띄우고 promise를 넘깁니다
 * (→ `useHomeHeroPhotoItems`).
 *
 * @param params locale과 선택적 초기 프로젝트 목록
 * @returns 현재 프로젝트 프리뷰 목록과 로딩 여부
 */
export const useHomeHeroProjectPreview = ({
  initialItems,
  locale,
}: UseHomeHeroProjectPreviewParams): UseHomeHeroProjectPreviewResult => {
  const resolvedInitialItems = initialItems ?? EMPTY_PROJECT_ITEMS;
  const hasInitialItems = resolvedInitialItems.length > 0;

  const { data, isLoading } = useQuery({
    enabled: !hasInitialItems,
    queryFn: async ({ signal }) => {
      const searchParams = new URLSearchParams({
        limit: String(HOME_HERO_PROJECT_PREVIEW_LIMIT),
        locale,
      });
      const response = await fetch(`/api/projects?${searchParams.toString()}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load home project preview: ${response.status}`);
      }

      const body: unknown = await response.json();

      if (!isProjectListPage(body)) {
        throw new Error('Invalid home project preview response');
      }

      return body.items;
    },
    queryKey: projects.preview(locale as AppLocale, HOME_HERO_PROJECT_PREVIEW_LIMIT),
    staleTime: Infinity,
  });

  return {
    isLoading: hasInitialItems ? false : isLoading,
    items: hasInitialItems ? resolvedInitialItems : (data ?? EMPTY_PROJECT_ITEMS),
  };
};
