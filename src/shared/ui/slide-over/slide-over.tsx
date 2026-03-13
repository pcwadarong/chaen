'use client';

import React, { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, cx } from 'styled-system/css';

import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';

type SlideOverProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ReactNode;
  className?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
};

const SLIDE_OVER_ANIMATION_MS = 600;

/**
 * 우측 슬라이드오버의 공통 포털, 포커스 관리, backdrop blur, 열림/닫힘 애니메이션을 제공합니다.
 */
export const SlideOver = ({
  ariaDescribedBy,
  ariaLabel,
  ariaLabelledBy,
  children,
  className,
  initialFocusRef,
  isOpen,
  onClose,
}: SlideOverProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const frameRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const openAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (isOpen) {
      setShouldRender(true);
      setIsVisible(false);

      const firstFrameId = window.requestAnimationFrame(() => {
        openAnimationFrameRef.current = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(firstFrameId);

        if (openAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(openAnimationFrameRef.current);
          openAnimationFrameRef.current = null;
        }
      };
    }

    if (!shouldRender) {
      return;
    }

    setIsVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setShouldRender(false);
      closeTimeoutRef.current = null;
    }, SLIDE_OVER_ANIMATION_MS);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [isMounted, isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender || !isMounted) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const computedPaddingRight = Number.parseFloat(
      window.getComputedStyle(document.body).paddingRight,
    );

    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${(Number.isNaN(computedPaddingRight) ? 0 : computedPaddingRight) + scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isMounted, shouldRender]);

  useEffect(
    () => () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (openAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(openAnimationFrameRef.current);
      }
    },
    [],
  );

  useDialogFocusManagement({
    containerRef: frameRef,
    initialFocusRef,
    isEnabled: shouldRender && isVisible,
    onEscape: onClose,
  });

  if (!isMounted || !shouldRender) return null;

  return createPortal(
    <div
      aria-hidden={!isVisible}
      className={cx(backdropClass, isVisible ? backdropOpenClass : backdropClosedClass)}
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        aria-describedby={ariaDescribedBy}
        aria-hidden={!isVisible}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        className={cx(panelBaseClass, isVisible ? panelOpenClass : panelClosedClass, className)}
        ref={frameRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
};

const backdropClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '80',
  bg: '[rgba(15,23,42,0.22)]',
  backdropFilter: '[blur(18px) saturate(135%)]',
  transitionProperty: '[opacity]',
  transitionDuration: '[720ms]',
  transitionTimingFunction: '[cubic-bezier(0.22,1,0.36,1)]',
});

const backdropOpenClass = css({
  opacity: '1',
  pointerEvents: 'auto',
});

const backdropClosedClass = css({
  opacity: '0',
  pointerEvents: 'none',
});

const panelBaseClass = css({
  position: 'fixed',
  top: '0',
  right: '0',
  height: 'dvh',
  transitionProperty: '[transform]',
  transitionDuration: '[720ms]',
  transitionTimingFunction: '[cubic-bezier(0.22,1,0.36,1)]',
  willChange: 'transform',
});

const panelOpenClass = css({
  opacity: '1',
  transform: 'translateX(0)',
});

const panelClosedClass = css({
  opacity: '1',
  transform: 'translateX(100%)',
});
