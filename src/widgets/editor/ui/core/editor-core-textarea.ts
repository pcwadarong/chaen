import type React from 'react';

import type { Locale } from '@/widgets/editor/ui/core/editor-core.types';

type TextareaRefMap = Record<Locale, { current: HTMLTextAreaElement | null }>;

/**
 * 숨겨진 panel에서 먼저 마운트된 textarea 높이를 현재 내용 기준으로 다시 계산합니다.
 */
export const resizeTextareaToContent = (element: HTMLTextAreaElement | null) => {
  if (!element) return;

  element.style.height = '0px';
  element.style.height = `${element.scrollHeight}px`;
};

/**
 * 현재 locale textarea scrollTop을 기억합니다.
 */
export const rememberTextareaScroll = (
  locale: Locale,
  scrollTopByLocaleRef: React.RefObject<Record<Locale, number>>,
  textareaRefs: TextareaRefMap,
) => {
  scrollTopByLocaleRef.current[locale] = textareaRefs[locale].current?.scrollTop ?? 0;
};
