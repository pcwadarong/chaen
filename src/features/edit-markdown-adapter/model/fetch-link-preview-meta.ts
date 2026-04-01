import type { FetchLinkPreviewMeta } from '@/entities/editor-core';
import type { LinkEmbedData } from '@/shared/lib/markdown/link-embed';

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
