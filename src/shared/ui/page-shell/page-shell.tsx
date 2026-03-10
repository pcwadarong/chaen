import React, { type ReactNode } from 'react';
import { css, cva } from 'styled-system/css';

type PageShellWidth = 'compact' | 'default';

type PageShellProps = {
  children: ReactNode;
  hideAppFrameFooter?: boolean;
  width?: PageShellWidth;
};

type PageHeaderProps = {
  action?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
};

type PageSectionProps = {
  children: ReactNode;
  title?: ReactNode;
  titleId?: string;
};

/**
 * 페이지 전반의 가로 폭과 세로 리듬을 맞추는 공통 셸입니다.
 */
export const PageShell = ({
  children,
  hideAppFrameFooter = false,
  width = 'default',
}: PageShellProps) => (
  <main
    data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}
    className={pageShellClass({ width })}
  >
    {children}
  </main>
);

/**
 * 페이지 상단 헤더를 같은 비례로 정리합니다.
 * 제목과 액션은 한 줄 플렉스에 두고, 보조 설명과 추가 메타는 아래로 쌓습니다.
 */
export const PageHeader = ({ action, children, description, meta, title }: PageHeaderProps) => (
  <header className={pageHeaderClass}>
    {meta ? <div className={pageHeaderMetaClass}>{meta}</div> : null}
    <div className={pageHeaderHeadlineRowClass}>
      <h1 className={pageHeaderTitleClass}>{title}</h1>
      {action ? <div className={pageHeaderActionWrapClass}>{action}</div> : null}
    </div>
    {description ? <p className={pageHeaderDescriptionClass}>{description}</p> : null}
    {children}
  </header>
);

/**
 * 본문 블록을 동일한 카드 표면과 `h2` 타이포그래피로 감쌉니다.
 */
export const PageSection = ({ children, title, titleId }: PageSectionProps) => (
  <section aria-labelledby={titleId} className={pageSectionClass}>
    {title ? (
      <h2 id={titleId} className={pageSectionTitleClass}>
        {title}
      </h2>
    ) : null}
    {children}
  </section>
);

const pageShellClass = cva({
  base: {
    mx: 'auto',
    px: '4',
    pt: '12',
    pb: '20',
    display: 'grid',
    gap: '5',
  },
  variants: {
    width: {
      compact: {
        width: '[min(820px, 100%)]',
      },
      default: {
        width: '[min(980px, 100%)]',
      },
    },
  },
  defaultVariants: {
    width: 'default',
  },
});

const pageHeaderClass = css({
  display: 'grid',
  gap: '3',
  pb: '7',
});

const pageHeaderMetaClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  color: 'muted',
  fontSize: 'sm',
});

const pageHeaderHeadlineRowClass = css({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '4',
  flexWrap: 'wrap',
});

const pageHeaderTitleClass = css({
  flex: '[1 1 18rem]',
  fontSize: '32',
  lineHeight: 'none',
  letterSpacing: '[-0.04em]',
});

const pageHeaderActionWrapClass = css({
  flex: '[0 0 auto]',
  display: 'inline-flex',
  alignItems: 'center',
});

const pageHeaderDescriptionClass = css({
  flex: '1',
  color: 'muted',
});

const pageSectionClass = css({
  display: 'grid',
  gap: '4',
});

const pageSectionTitleClass = css({
  fontSize: 'xl',
  lineHeight: 'tight',
  letterSpacing: '[-0.02em]',
});
