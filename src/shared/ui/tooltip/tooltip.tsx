'use client';

import React, {
  cloneElement,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { css, cx } from 'styled-system/css';

type TooltipTriggerProps = {
  'aria-describedby'?: string;
};

type TooltipProps = {
  children: React.ReactElement<TooltipTriggerProps>;
  content: string;
  className?: string;
  contentClassName?: string;
  forceOpen?: boolean;
  openOnFocus?: boolean;
  portalClassName?: string;
  preferredPlacement?: 'auto' | 'bottom' | 'top';
};

/**
 * hover/focus 시 보조 설명을 노출하는 경량 툴팁입니다.
 * 트리거 요소에 aria-describedby를 연결해 접근성 이름을 보완합니다.
 */
export const Tooltip = ({
  children,
  className,
  content,
  contentClassName,
  forceOpen = false,
  openOnFocus = true,
  portalClassName,
  preferredPlacement = 'top',
}: TooltipProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>();
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const tooltipId = useId();
  const isOpen = forceOpen || isHovering || (openOnFocus && isFocused);

  if (!isValidElement(children)) {
    throw new Error('Tooltip requires a single React element child.');
  }

  const triggerElement = children as React.ReactElement<TooltipTriggerProps>;
  const childProps = triggerElement.props;
  const describedBy = [childProps['aria-describedby'], isOpen ? tooltipId : null]
    .filter(Boolean)
    .join(' ');

  useLayoutEffect(() => {
    if (!isOpen) {
      setTooltipStyle(undefined);
      return;
    }

    /**
     * 트리거 래퍼 기준으로 tooltip viewport 좌표를 계산합니다.
     */
    const updateTooltipPosition = () => {
      if (!rootRef.current) return;

      const triggerRect = rootRef.current.getBoundingClientRect();
      const availableSpaceAbove = triggerRect.top;
      const availableSpaceBelow = window.innerHeight - triggerRect.bottom;
      const shouldPlaceBelow =
        preferredPlacement === 'bottom'
          ? true
          : preferredPlacement === 'top'
            ? false
            : availableSpaceAbove < 40 && availableSpaceBelow >= availableSpaceAbove;

      setTooltipStyle({
        left: triggerRect.left + triggerRect.width / 2,
        position: 'fixed',
        top: shouldPlaceBelow ? triggerRect.bottom + 8 : triggerRect.top - 8,
        transform: shouldPlaceBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      });
    };

    updateTooltipPosition();

    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [isOpen, preferredPlacement]);

  return (
    <span
      className={cx(rootClass, className)}
      ref={rootRef}
      onBlurCapture={() => {
        if (!openOnFocus) return;
        setIsFocused(false);
      }}
      onFocusCapture={() => {
        if (!openOnFocus) return;
        setIsFocused(true);
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {cloneElement<TooltipTriggerProps>(triggerElement, {
        'aria-describedby': describedBy || undefined,
      })}
      {isOpen
        ? createPortal(
            <span
              className={cx(tooltipPortalClass, portalClassName)}
              id={tooltipId}
              role="tooltip"
              style={{
                ...tooltipStyle,
                visibility: tooltipStyle ? 'visible' : 'hidden',
              }}
            >
              <span className={cx(tooltipClass, contentClassName)}>{content}</span>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
};

const rootClass = css({
  display: 'inline-flex',
  flex: 'none',
});

const tooltipClass = css({
  px: '2',
  py: '1',
  borderRadius: 'md',
  backgroundColor: 'gray.900',
  color: 'white',
  fontSize: 'xs',
  lineHeight: 'tight',
  whiteSpace: 'nowrap',
  boxShadow: 'floating',
});

const tooltipPortalClass = css({
  zIndex: '[9999]',
  pointerEvents: 'none',
});
