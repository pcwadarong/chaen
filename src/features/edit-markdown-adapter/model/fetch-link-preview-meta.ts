import type { QueryClient } from '@tanstack/react-query';

import type { FetchLinkPreviewMeta } from '@/entities/editor-core';
import type { LinkEmbedData } from '@/shared/lib/markdown/link-embed';
import { og } from '@/shared/lib/query/query-keys';

/**
 * OG 미리보기 캐시 유효 시간(24시간)입니다. `/api/og` 라우트의 `max-age=86400`을
 * 클라이언트 캐시에서 그대로 반영해, 같은 URL을 반복 조회할 때 네트워크 요청을
 * 줄입니다.
 */
const OG_PREVIEW_STALE_TIME = 24 * 60 * 60_000;

/**
 * 현재 앱의 `/api/og` endpoint를 이용해 링크 preview 메타데이터를 조회합니다.
 * 외부 package 단계에서는 이 adapter를 host app 전용 구현으로 분리하고, UI는 동일한 fetcher 계약만 사용합니다.
 *
 * @param url preview 메타데이터를 조회할 대상 URL입니다.
 * @param signal 요청 취소를 위한 AbortSignal입니다.
 * @returns OG 메타 응답을 link preview 데이터 형식으로 반환합니다.
 */
export const fetchLinkPreviewMetaAdapter: FetchLinkPreviewMeta = async (url, signal) => {
  const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`OG fetch failed: ${response.status}`);
  }

  return (await response.json()) as LinkEmbedData;
};

/**
 * 기본 OG 어댑터를 React Query 캐시(`fetchQuery`)로 감싼 fetcher를 만듭니다.
 *
 * 같은 URL을 여러 링크 카드가 동시에 조회해도 `og.preview(url)` 키로 dedupe되고,
 * `staleTime`(24시간) 동안 결과를 재사용해 중복 네트워크 요청을 없앱니다. 원시
 * 어댑터(`fetchLinkPreviewMetaAdapter`)는 테스트/주입용으로 그대로 export를 유지합니다.
 *
 * @param queryClient 캐시를 관리할 QueryClient입니다.
 * @returns 캐시를 경유하는 link preview fetcher입니다.
 */
export const createCachedFetchLinkPreviewMeta =
  (queryClient: QueryClient): FetchLinkPreviewMeta =>
  url =>
    queryClient.fetchQuery({
      // fetchQuery는 observer 없이 곧바로 inactive가 되므로, 기본 gcTime(5분)이면
      // staleTime(24시간)보다 먼저 캐시가 수거된다. gcTime을 함께 맞춰 유지한다.
      gcTime: OG_PREVIEW_STALE_TIME,
      queryFn: ({ signal }) => fetchLinkPreviewMetaAdapter(url, signal),
      queryKey: og.preview(url),
      staleTime: OG_PREVIEW_STALE_TIME,
    });
