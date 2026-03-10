import React from 'react';
import { css, cx } from 'styled-system/css';

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
  <div className={cx(wrapperClass, align === 'end' ? endAlignClass : undefined)}>
    <div className={rowClass}>
      {action && actionSide === 'start' ? (
        <div
          className={cx(
            startActionSlotClass,
            actionVerticalAlign === 'start' ? topActionSlotClass : undefined,
          )}
        >
          {action}
        </div>
      ) : null}
      <div className={columnClass}>
        {meta?.position === 'top' ? <EntryMeta meta={meta} /> : null}
        <div
          className={cx(
            bubbleBaseClass,
            toneClassMap[tone ?? toneByVariant[variant]],
            bubbleWidthClass,
          )}
        >
          {header ? <header>{header}</header> : null}
          <div className={bodySlotClass}>{children}</div>
        </div>
        {meta?.position === 'bottom' ? <EntryMeta meta={meta} /> : null}
      </div>
      {action && actionSide === 'end' ? (
        <div
          className={cx(
            endActionSlotClass,
            actionVerticalAlign === 'start' ? topActionSlotClass : undefined,
          )}
        >
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
  <div className={cx(metaClass, meta.position === 'bottom' ? bottomMetaClass : undefined)}>
    {meta.authorName ? (
      meta.authorUrl ? (
        <a
          className={authorLinkClass}
          href={meta.authorUrl}
          rel="noreferrer noopener"
          target="_blank"
        >
          <strong className={nameClass}>{meta.authorName}</strong>
          <LinkExternalIcon aria-hidden color="primary" size="sm" />
        </a>
      ) : (
        <strong className={nameClass}>{meta.authorName}</strong>
      )
    ) : null}
    <time className={dateClass} dateTime={meta.dateTime}>
      {meta.dateText}
    </time>
  </div>
);

const wrapperClass = css({
  display: 'flex',
  width: 'full',
  minWidth: '0',
});

const endAlignClass = css({
  justifyContent: 'flex-end',
});

const rowClass = css({
  display: 'flex',
  alignItems: 'flex-end',
  gap: '2',
  width: '[fit-content]',
  maxWidth: 'full',
});

const columnClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  minWidth: '0',
});

const startActionSlotClass = css({
  marginRight: '[-0.7rem]',
});

const endActionSlotClass = css({
  marginLeft: '[-0.7rem]',
});

const topActionSlotClass = css({
  alignSelf: 'flex-start',
});

const bubbleBaseClass = css({
  width: 'full',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  p: '4',
  borderRadius: '2xl',
});

const toneByVariant: Record<GuestbookEntryBubbleVariant, GuestbookEntryBubbleTone> = {
  reply: 'inverse',
  thread: 'surface',
};

const toneClassMap: Record<GuestbookEntryBubbleTone, string> = {
  surface: css({
    border: '[1px solid var(--colors-border)]',
    backgroundColor: 'surface',
    color: 'text',
  }),
  inverse: css({
    backgroundColor: 'primary',
    color: 'primaryContrast',
  }),
};

const bubbleWidthClass = css({
  maxWidth: '[min(46rem, calc(100vw - 4.75rem))]',
});

const bodySlotClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  minWidth: '0',
});

const metaClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
});

const bottomMetaClass = css({
  justifyContent: 'flex-end',
});

const authorLinkClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  color: 'primary',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    textDecoration: 'underline',
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const nameClass = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
});

const dateClass = css({
  color: 'muted',
  fontSize: 'sm',
});
