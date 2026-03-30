import React from 'react';
import { css, cx } from 'styled-system/css';

type LoadingDotsProps = Readonly<{
  className?: string;
  dotClassName?: string;
}>;

/**
 * 전역 로딩 화면과 씬 로딩 shell이 공통으로 재사용하는 dot 인디케이터입니다.
 * 로딩 시점의 시각 리듬을 통일해 라우트 로딩과 씬 로딩이 같은 시스템으로 보이게 합니다.
 */
export const LoadingDots = ({ className, dotClassName }: LoadingDotsProps) => (
  <div aria-hidden className={cx(wrapperClass, className)}>
    {Array.from({ length: 3 }).map((_, index) => (
      <span
        className={cx(dotClass, dotClassName)}
        key={index}
        style={{
          animationDelay: `${index * 140}ms`,
        }}
      />
    ))}
  </div>
);

const wrapperClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3',
});

const dotClass = css({
  display: 'inline-block',
  width: '[0.8rem]',
  height: '[0.8rem]',
  borderRadius: 'full',
  backgroundColor: 'textSubtle',
  animation: '[global-route-loading-dot 880ms ease-in-out infinite]',
});
