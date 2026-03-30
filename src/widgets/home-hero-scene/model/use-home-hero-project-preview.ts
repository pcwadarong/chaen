'use client';

import { useEffect, useState } from 'react';

import type { ProjectListItem, ProjectListPage } from '@/entities/project/model/types';

type UseHomeHeroProjectPreviewParams = Readonly<{
  initialItems?: ProjectListItem[];
  locale: string;
}>;

type UseHomeHeroProjectPreviewResult = Readonly<{
  isLoading: boolean;
  items: ProjectListItem[];
}>;

const EMPTY_PROJECT_ITEMS: ProjectListItem[] = [];

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
 * 홈 첫 진입에서는 frame 이미지(photo)가 즉시 필요하지만, 프로젝트 카드는
 * 스크롤 전환 또는 바텀 시트 열기 이후에야 실제로 보입니다.
 * 따라서 서버 첫 렌더를 프로젝트 조회에 묶지 않고, 클라이언트에서 후속 조회해
 * 초기 장면 진입 속도를 우선 확보합니다.
 *
 * @param params locale과 선택적 초기 프로젝트 목록
 * @returns 현재 프로젝트 프리뷰 목록과 로딩 여부
 */
export const useHomeHeroProjectPreview = ({
  initialItems,
  locale,
}: UseHomeHeroProjectPreviewParams): UseHomeHeroProjectPreviewResult => {
  const resolvedInitialItems = initialItems ?? EMPTY_PROJECT_ITEMS;
  const [items, setItems] = useState<ProjectListItem[]>(resolvedInitialItems);
  const [isLoading, setIsLoading] = useState(resolvedInitialItems.length === 0);

  useEffect(() => {
    if (resolvedInitialItems.length > 0) {
      setItems(resolvedInitialItems);
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadProjectPreview = async () => {
      setIsLoading(true);

      try {
        const searchParams = new URLSearchParams({
          limit: '3',
          locale,
        });
        const response = await fetch(`/api/projects?${searchParams.toString()}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load home project preview: ${response.status}`);
        }

        const body: unknown = await response.json();

        if (!isProjectListPage(body)) {
          throw new Error('Invalid home project preview response');
        }

        if (!abortController.signal.aborted) {
          setItems(body.items);
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('[home-hero] project preview fetch failed', {
          error,
          locale,
        });
        setItems([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadProjectPreview();

    return () => {
      abortController.abort();
    };
  }, [locale, resolvedInitialItems]);

  return {
    isLoading,
    items,
  };
};
