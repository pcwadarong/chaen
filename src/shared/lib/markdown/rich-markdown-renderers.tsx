import React from 'react';

import type { MarkdownRendererHostAdapters, MarkdownSegment } from '@/entities/editor-core';
import { resolveMarkdownAttachmentHref } from '@/features/edit-markdown-adapter';
import { MarkdownAttachment } from '@/shared/ui/markdown/markdown-attachment';
import { MarkdownGallery } from '@/shared/ui/markdown/markdown-gallery';
import { MarkdownMath } from '@/shared/ui/markdown/markdown-math';
import { MarkdownVideo } from '@/shared/ui/markdown/markdown-video';

type RichMarkdownCustomSegment = Extract<
  MarkdownSegment,
  { type: 'attachment' | 'gallery' | 'math' | 'video' }
>;

export type RichMarkdownSegmentRendererArgs<TSegment extends RichMarkdownCustomSegment> = {
  key: string;
  segment: TSegment;
};

export type RichMarkdownRendererRegistry = {
  attachment: (
    args: RichMarkdownSegmentRendererArgs<Extract<MarkdownSegment, { type: 'attachment' }>>,
  ) => React.ReactNode;
  gallery: (
    args: RichMarkdownSegmentRendererArgs<Extract<MarkdownSegment, { type: 'gallery' }>>,
  ) => React.ReactNode;
  math: (
    args: RichMarkdownSegmentRendererArgs<Extract<MarkdownSegment, { type: 'math' }>>,
  ) => React.ReactNode;
  video: (
    args: RichMarkdownSegmentRendererArgs<Extract<MarkdownSegment, { type: 'video' }>>,
  ) => React.ReactNode;
};

export type PartialRichMarkdownRendererRegistry = Partial<RichMarkdownRendererRegistry>;

/**
 * rich-markdown의 custom segment renderer 기본 구현을 반환합니다.
 * host app이나 후속 package 단계에서는 이 기본 registry를 일부 override해 attachment,
 * gallery, math, video 렌더링만 교체할 수 있습니다.
 *
 * @returns custom segment별 기본 renderer registry를 반환합니다.
 */
export const createDefaultRichMarkdownRendererRegistry = (
  adapters?: MarkdownRendererHostAdapters,
): RichMarkdownRendererRegistry => ({
  attachment: ({ key, segment }) => (
    <MarkdownAttachment
      contentType={segment.contentType}
      fileName={segment.fileName}
      fileSize={segment.fileSize}
      href={segment.href}
      key={key}
      resolveAttachmentHref={adapters?.resolveAttachmentHref ?? resolveMarkdownAttachmentHref}
    />
  ),
  gallery: ({ key, segment }) => (
    <MarkdownGallery galleryId={key} items={segment.items} key={key} />
  ),
  math: ({ key, segment }) => (
    <MarkdownMath formula={segment.formula} isBlock={segment.isBlock} key={key} />
  ),
  video: ({ key, segment }) => (
    <MarkdownVideo
      key={key}
      provider={segment.provider}
      src={segment.src}
      videoId={segment.videoId}
    />
  ),
});

/**
 * 기본 rich-markdown renderer와 host override를 병합합니다.
 *
 * @param overrides host app이 교체하고 싶은 custom segment renderer 일부입니다.
 * @returns 기본 구현과 override가 합쳐진 최종 registry를 반환합니다.
 */
export const createRichMarkdownRendererRegistry = (
  overrides?: PartialRichMarkdownRendererRegistry,
  adapters?: MarkdownRendererHostAdapters,
): RichMarkdownRendererRegistry => ({
  ...createDefaultRichMarkdownRendererRegistry(adapters),
  ...overrides,
});
