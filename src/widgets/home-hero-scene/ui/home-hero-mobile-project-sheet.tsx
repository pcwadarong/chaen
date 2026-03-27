'use client';

import { useTranslations } from 'next-intl';
import React, { type RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css } from 'styled-system/css';

import type { ProjectListItem } from '@/entities/project/model/types';
import { useDialogFocusManagement } from '@/shared/lib/react/use-dialog-focus-management';
import { Button } from '@/shared/ui/button/button';
import { ProjectShowcase } from '@/widgets/project-showcase/ui/project-showcase';

type HomeHeroMobileProjectSheetProps = {
  initialFocusRef?: RefObject<HTMLElement | null>;
  isOpen: boolean;
  items: ProjectListItem[];
  onClose: () => void;
  title: string;
};

const MOBILE_PROJECT_SHEET_ANIMATION_MS = 360;

/**
 * 모바일 홈 씬에서 프로젝트 목록을 아래에서 위로 올려 보여주는 바텀 시트입니다.
 */
export const HomeHeroMobileProjectSheet = ({
  initialFocusRef,
  isOpen,
  items,
  onClose,
  title,
}: HomeHeroMobileProjectSheetProps) => {
  const t = useTranslations('Home');
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
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

    if (!shouldRender) return;

    setIsVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setShouldRender(false);
      closeTimeoutRef.current = null;
    }, MOBILE_PROJECT_SHEET_ANIMATION_MS);

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
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
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

  useEffect(() => {
    const panel = panelRef.current;

    if (!panel) return;

    if (isVisible) {
      panel.removeAttribute('inert');
      return;
    }

    panel.setAttribute('inert', '');
  }, [isVisible]);

  useDialogFocusManagement({
    containerRef: panelRef,
    initialFocusRef,
    isEnabled: shouldRender && isVisible,
    onEscape: onClose,
  });

  if (!isMounted || !shouldRender) return null;

  return createPortal(
    <div
      className={backdropClass}
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-label={t('mobileProjectPanelAriaLabel')}
        aria-hidden={!isVisible}
        aria-modal="true"
        className={panelClass}
        data-state={isVisible ? 'open' : 'closed'}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={handleWrapClass}>
          <span aria-hidden="true" className={handleClass} />
        </div>
        <div className={headerClass}>
          <h2 className={titleClass}>{title}</h2>
          <Button onClick={onClose} size="sm" tone="black" type="button" variant="ghost">
            {t('mobileProjectPanelCloseLabel')}
          </Button>
        </div>
        <div className={contentClass}>
          <ProjectShowcase
            description={t('showcaseScreenReaderDescription')}
            descriptionVisibility="sr-only"
            emptyText={t('emptyProjects')}
            items={items}
            hideHeader
            title={title}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

const backdropClass = css({
  position: 'fixed',
  inset: '0',
  zIndex: '40',
  bg: '[rgb(15 23 42 / 0.32)]',
  backdropBlur: 'md',
});

const panelClass = css({
  position: 'absolute',
  insetInline: '0',
  bottom: '0',
  minHeight: '[min(68dvh, 720px)]',
  maxHeight: '[88dvh]',
  display: 'grid',
  gridTemplateRows: 'auto auto minmax(0, 1fr)',
  borderTopLeftRadius: '3xl',
  borderTopRightRadius: '3xl',
  bg: 'surface',
  boxShadow: 'floating',
  transitionProperty: '[transform, opacity]',
  transitionDuration: '[360ms]',
  transitionTimingFunction: '[cubic-bezier(0.22,1,0.36,1)]',
  willChange: 'transform',
  '&[data-state="closed"]': {
    opacity: '0',
    transform: 'translateY(100%)',
  },
  '&[data-state="open"]': {
    opacity: '1',
    transform: 'translateY(0)',
  },
});

const handleWrapClass = css({
  display: 'flex',
  justifyContent: 'center',
  pt: '3',
});

const handleClass = css({
  width: '12',
  height: '1.5',
  borderRadius: 'full',
  bg: 'border',
});

const headerClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '5',
  pt: '3',
  pb: '4',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border',
});

const titleClass = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
  letterSpacing: '[-0.02em]',
});

const contentClass = css({
  overflowY: 'auto',
  px: '5',
  py: '4',
});
