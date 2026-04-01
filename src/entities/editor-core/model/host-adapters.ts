import type { LinkEmbedData } from '@/shared/lib/markdown/link-embed';

export type MarkdownImageViewerLabels = {
  actionBarAriaLabel: string;
  closeAriaLabel: string;
  fitToScreenAriaLabel: string;
  imageViewerAriaLabel?: string;
  locateSourceAriaLabel: string;
  nextAriaLabel: string;
  openAriaLabel: string;
  previousAriaLabel: string;
  selectForFrameAriaLabel: string;
  selectForFrameLabel: string;
  thumbnailListAriaLabel: string;
  zoomInAriaLabel: string;
  zoomOutAriaLabel: string;
};

/**
 * 첨부 파일 렌더러가 host app의 다운로드 링크 규칙을 주입받을 때 사용하는 resolver 타입입니다.
 * resolver가 없으면 package 기본 구현은 원본 href를 그대로 사용합니다.
 */
export type ResolveAttachmentHref = (payload: { fileName: string; href: string }) => string | null;

/**
 * 링크 preview 카드가 host app의 메타데이터 조회 방식을 주입받을 때 사용하는 fetcher 타입입니다.
 * fetcher가 없으면 package 기본 구현은 preview 카드를 포기하고 일반 링크 fallback으로 렌더링합니다.
 */
export type FetchLinkPreviewMeta = (
  url: string,
  signal?: AbortSignal,
) => Promise<LinkEmbedData | null>;

/**
 * markdown renderer와 보조 UI가 host app으로부터 주입받는 최소 adapter 집합입니다.
 * 현재 단계에서는 attachment href 해석과 link preview 메타 조회만 먼저 분리합니다.
 */
export type MarkdownRendererHostAdapters = {
  fetchLinkPreviewMeta?: FetchLinkPreviewMeta;
  imageViewerLabels?: Partial<MarkdownImageViewerLabels>;
  resolveAttachmentHref?: ResolveAttachmentHref;
};
