'use client';

import { css, type SerializedStyles } from '@emotion/react';
import React from 'react';

import { LinkExternalIcon } from '@/shared/ui/icons/app-icons';

type GuestbookEntryBubbleTone = 'inverse' | 'surface';
type GuestbookEntryBubbleAlign = 'end' | 'start';
type GuestbookEntryBubbleVariant = 'reply' | 'thread';

type GuestbookEntryBubbleMeta = {
  authorName?: string;
  authorUrl?: string | null;
  dateText: string;
  dateTime: string;
  position: 'bottom' | 'top';
};

type GuestbookEntryBubbleProps = {
  action?: React.ReactNode;
  actionSide?: GuestbookEntryBubbleAlign;
  actionVerticalAlign?: GuestbookEntryBubbleAlign;
  align?: GuestbookEntryBubbleAlign;
  children: React.ReactNode;
  header?: React.ReactNode;
  meta?: GuestbookEntryBubbleMeta;
  tone?: GuestbookEntryBubbleTone;
  variant?: GuestbookEntryBubbleVariant;
};

/**
 * 방명록 엔트리 버블의 공통 외곽/메타/액션 레이아웃을 담당합니다.
 * 원댓글과 답글은 variant, meta, action 설정만 넘기고 상세 배치는 이 컴포넌트가 처리합니다.
 */
export const GuestbookEntryBubble = ({
  action,
  actionSide = 'end',
  actionVerticalAlign = 'end',
  align = 'start',
  children,
  header,
  meta,
  tone,
  variant = 'thread',
}: GuestbookEntryBubbleProps) => (
  <div css={[wrapperStyle, align === 'end' && endAlignStyle]}>
    <div css={rowStyle}>
      {action && actionSide === 'start' ? (
        <div css={[startActionSlotStyle, actionVerticalAlign === 'start' && topActionSlotStyle]}>
          {action}
        </div>
      ) : null}
      <div css={columnStyle}>
        {meta?.position === 'top' ? <EntryMeta meta={meta} /> : null}
        <div
          css={[bubbleBaseStyle, toneStyleMap[tone ?? toneByVariant[variant]], bubbleWidthStyle]}
        >
          {header ? <header>{header}</header> : null}
          <div css={bodySlotStyle}>{children}</div>
        </div>
        {meta?.position === 'bottom' ? <EntryMeta meta={meta} /> : null}
      </div>
      {action && actionSide === 'end' ? (
        <div css={[endActionSlotStyle, actionVerticalAlign === 'start' && topActionSlotStyle]}>
          {action}
        </div>
      ) : null}
    </div>
  </div>
);

type EntryMetaProps = {
  meta: GuestbookEntryBubbleMeta;
};

/**
 * 방명록 버블 위/아래에 붙는 메타 정보를 렌더링합니다.
 */
const EntryMeta = ({ meta }: EntryMetaProps) => (
  <div css={[metaStyle, meta.position === 'bottom' ? bottomMetaStyle : undefined]}>
    {meta.authorName ? (
      meta.authorUrl ? (
        <a css={authorLinkStyle} href={meta.authorUrl} rel="noreferrer noopener" target="_blank">
          <strong css={nameStyle}>{meta.authorName}</strong>
          <LinkExternalIcon aria-hidden color="primary" size="sm" />
        </a>
      ) : (
        <strong css={nameStyle}>{meta.authorName}</strong>
      )
    ) : null}
    <time dateTime={meta.dateTime} css={dateStyle}>
      {meta.dateText}
    </time>
  </div>
);

const wrapperStyle = css`
  display: flex;
  width: 100%;
  min-width: 0;
`;

const endAlignStyle = css`
  justify-content: flex-end;
`;

const rowStyle = css`
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  width: fit-content;
  max-width: 100%;
`;

const columnStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`;

const startActionSlotStyle = css`
  margin-right: -0.7rem;
`;

const endActionSlotStyle = css`
  margin-left: -0.7rem;
`;

const topActionSlotStyle = css`
  align-self: flex-start;
`;

const bubbleBaseStyle = css`
  width: fit-content;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-l);
`;

const toneByVariant: Record<GuestbookEntryBubbleVariant, GuestbookEntryBubbleTone> = {
  reply: 'inverse',
  thread: 'surface',
};

const toneStyleMap: Record<GuestbookEntryBubbleTone, SerializedStyles> = {
  surface: css`
    border: 1px solid rgb(var(--color-border) / 0.25);
    background-color: rgb(var(--color-surface) / 0.82);
    color: rgb(var(--color-text));
  `,
  inverse: css`
    background-color: rgb(var(--color-primary));
    color: rgb(var(--color-primary-contrast));
  `,
};

const bubbleWidthStyle = css`
  max-width: min(46rem, calc(100vw - 4.75rem));
`;

const bodySlotStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`;

const metaStyle = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

const bottomMetaStyle = css`
  justify-content: flex-end;
`;

const authorLinkStyle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: rgb(var(--color-primary));
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    outline: none;
  }
`;

const nameStyle = css`
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-semibold);
`;

const dateStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-14);
`;
