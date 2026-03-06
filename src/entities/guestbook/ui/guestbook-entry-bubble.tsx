'use client';

import { css, type SerializedStyles } from '@emotion/react';
import React from 'react';

type GuestbookEntryBubbleTone = 'inverse' | 'primary' | 'surface';
type GuestbookEntryBubbleAlign = 'end' | 'start';

type GuestbookEntryBubbleProps = {
  align?: GuestbookEntryBubbleAlign;
  bottom?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  maxWidth: string;
  top?: React.ReactNode;
  tone?: GuestbookEntryBubbleTone;
};

/**
 * 방명록 카드/버블의 공통 외곽 셸입니다.
 * 정렬, 최대 너비, 표면 톤만 바꾸고 내부 header/body/footer는 호출부가 주입합니다.
 */
export const GuestbookEntryBubble = ({
  align = 'start',
  bottom,
  children,
  footer,
  header,
  maxWidth,
  top,
  tone = 'surface',
}: GuestbookEntryBubbleProps) => (
  <div css={[wrapperStyle, align === 'end' ? endAlignStyle : startAlignStyle]}>
    <div
      css={[
        columnStyle,
        align === 'end' ? endColumnStyle : startColumnStyle,
        getWidthStyle(maxWidth),
      ]}
    >
      {top ? (
        <div css={[topSlotStyle, align === 'end' ? endSlotStyle : startSlotStyle]}>{top}</div>
      ) : null}
      <div css={[bubbleBaseStyle, toneStyleMap[tone]]}>
        {header ? <header css={headerSlotStyle}>{header}</header> : null}
        <div css={bodySlotStyle}>{children}</div>
        {footer ? <footer css={footerSlotStyle}>{footer}</footer> : null}
      </div>
      {bottom ? (
        <div css={[bottomSlotStyle, align === 'end' ? endSlotStyle : startSlotStyle]}>{bottom}</div>
      ) : null}
    </div>
  </div>
);

const wrapperStyle = css`
  display: flex;
  width: 100%;
`;

const startAlignStyle = css`
  justify-content: flex-start;
`;

const endAlignStyle = css`
  justify-content: flex-end;
`;

const columnStyle = css`
  width: fit-content;
  display: grid;
  gap: var(--space-2);
`;

const startColumnStyle = css`
  justify-items: start;
`;

const endColumnStyle = css`
  justify-items: end;
`;

const bubbleBaseStyle = css`
  width: fit-content;
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-l);
`;

const toneStyleMap: Record<GuestbookEntryBubbleTone, SerializedStyles> = {
  surface: css`
    border: 1px solid rgb(var(--color-border) / 0.25);
    background-color: rgb(var(--color-surface) / 0.82);
    color: rgb(var(--color-text));
  `,
  inverse: css`
    background-color: rgb(var(--color-text) / 0.78);
    color: rgb(var(--color-surface));
  `,
  primary: css`
    background-color: rgb(var(--color-primary));
    color: rgb(var(--color-primary-contrast));
  `,
};

const getWidthStyle = (maxWidth: string) => css`
  max-width: ${maxWidth};
`;

const headerSlotStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
`;

const bodySlotStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const topSlotStyle = css`
  width: 100%;
`;

const bottomSlotStyle = css`
  width: 100%;
`;

const startSlotStyle = css`
  justify-self: start;
`;

const endSlotStyle = css`
  justify-self: end;
`;

const footerSlotStyle = css`
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
`;
