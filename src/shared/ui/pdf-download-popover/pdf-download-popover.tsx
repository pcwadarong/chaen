'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import type { PdfFileDownloadOption } from '@/entities/pdf-file/model/types';
import { Button } from '@/shared/ui/button/button';
import { FileIcon } from '@/shared/ui/icons/app-icons';
import { Popover } from '@/shared/ui/popover/popover';

type PdfDownloadPopoverProps = {
  className?: string;
  label: string;
  options: PdfFileDownloadOption[];
  panelLabel?: string;
  unavailableLabel: string;
};

const localeCodeLabelMap = {
  en: 'EN',
  ko: 'KO',
} as const;

/**
 * 여러 고정 PDF 자산 중 하나를 선택해 내려받는 팝오버 버튼입니다.
 * 공개 페이지에서는 단일 액션 버튼을 유지하면서 국문/영문 파일을 함께 노출합니다.
 */
export const PdfDownloadPopover = ({
  className,
  label,
  options,
  panelLabel,
  unavailableLabel,
}: PdfDownloadPopoverProps) => {
  const hasDownloadableOption = options.some(option => option.href);

  if (!hasDownloadableOption) {
    return (
      <Button
        aria-disabled="true"
        className={cx(triggerButtonClass, className)}
        disabled
        size="md"
        tone="white"
        type="button"
        variant="solid"
      >
        <span className={triggerLabelClass}>
          <FileIcon aria-hidden color="muted" size="md" />
          <span>{unavailableLabel}</span>
        </span>
      </Button>
    );
  }

  return (
    <Popover
      panelClassName={panelClass}
      panelLabel={panelLabel ?? label}
      triggerClassName={cx(triggerButtonClass, className)}
      triggerContent={
        <span className={triggerLabelClass}>
          <FileIcon aria-hidden color="muted" size="md" />
          <span>{label}</span>
        </span>
      }
      triggerSize="md"
      triggerTone="white"
      triggerVariant="solid"
    >
      <div className={optionListClass}>
        {options.map(option => {
          const optionCode = localeCodeLabelMap[option.locale];
          const optionAriaLabel = `${optionCode} ${option.fileName}`;

          if (option.href) {
            return (
              <Button
                asChild
                className={optionButtonClass}
                fullWidth
                key={option.assetKey}
                size="sm"
                tone="white"
                variant="ghost"
              >
                <a
                  aria-label={optionAriaLabel}
                  download={option.fileName}
                  href={option.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className={optionCodeClass}>{optionCode}</span>
                  <span className={optionLabelClass}>{option.fileName}</span>
                </a>
              </Button>
            );
          }

          return (
            <Button
              aria-disabled="true"
              aria-label={optionAriaLabel}
              className={optionButtonClass}
              disabled
              fullWidth
              key={option.assetKey}
              size="sm"
              tone="white"
              variant="ghost"
            >
              <span className={optionCodeClass}>{optionCode}</span>
              <span className={optionLabelClass}>{option.fileName}</span>
            </Button>
          );
        })}
      </div>
    </Popover>
  );
};

const triggerLabelClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
});

const triggerButtonClass = css({
  transition: '[transform 180ms ease]',
  _hover: {
    transform: 'translateY(-2px)',
    background: 'surface',
    borderColor: 'borderStrong',
  },
  _active: {
    transform: 'translateY(1px)',
  },
});

const panelClass = css({
  minWidth: '[18rem]',
  p: '2',
  borderRadius: '2xl',
  border: '[1px solid var(--colors-border)]',
  backgroundColor: 'surface',
  boxShadow: 'floating',
});

const optionListClass = css({
  display: 'grid',
  gap: '1',
});

const optionButtonClass = css({
  justifyContent: 'flex-start',
  minHeight: '[3rem]',
  px: '3',
  textAlign: 'left',
  borderColor: 'border',
  '& > span': {
    width: 'full',
    justifyContent: 'flex-start',
  },
  _hover: {
    borderColor: 'borderStrong',
    backgroundColor: 'surfaceMuted',
  },
});

const optionCodeClass = css({
  flexShrink: '0',
  minWidth: '[2rem]',
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[0.12em]',
});

const optionLabelClass = css({
  minWidth: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
