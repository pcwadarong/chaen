'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type { ResumePublishSettings } from '@/entities/resume/model/resume-editor.types';
import { Button } from '@/shared/ui/button/button';

type ResumePublishErrors = {
  koBody?: string;
  koTitle?: string;
  pdf?: string;
};

type ResumePublishStatusSectionProps = {
  errors: ResumePublishErrors;
  isCheckingPdfStatus: boolean;
  isUploading: boolean;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  settings: ResumePublishSettings;
};

type ResumePublishFooterProps = {
  isCheckingPdfStatus: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

/**
 * 현재 게시 대상 PDF 정보와 업로드 상태를 보여주는 섹션입니다.
 */
const ResumePublishStatusSectionBase = ({
  errors,
  isCheckingPdfStatus,
  isUploading,
  onFileChange,
  settings,
}: ResumePublishStatusSectionProps) => (
  <div className={sectionClass}>
    <div className={rowClass}>
      <div className={copyGroupClass}>
        <p className={sectionLabelClass}>파일명</p>
        <p className={fileNameClass}>{settings.downloadFileName}</p>
      </div>
      <label className={uploadButtonClass}>
        <input
          accept="application/pdf"
          className={fileInputClass}
          disabled={isUploading}
          onChange={onFileChange}
          type="file"
        />
        {isUploading ? '업로드 중...' : 'PDF 업로드'}
      </label>
    </div>
    <div className={metaGridClass}>
      <div className={metaItemClass}>
        <span className={metaLabelClass}>다운로드 경로</span>
        <span className={metaValueClass}>{settings.downloadPath}</span>
      </div>
      <div className={metaItemClass}>
        <span className={metaLabelClass}>Storage 경로</span>
        <span className={metaValueClass}>{settings.filePath}</span>
      </div>
      <div className={metaItemClass}>
        <span className={metaLabelClass}>상태</span>
        <span aria-live="polite" className={metaValueClass}>
          {isCheckingPdfStatus
            ? 'PDF 상태 확인 중...'
            : settings.isPdfReady
              ? '업로드됨'
              : 'PDF 업로드 필요'}
        </span>
      </div>
    </div>
    {errors.pdf ? (
      <p aria-live="assertive" className={errorClass} role="alert">
        {errors.pdf}
      </p>
    ) : null}
    {errors.koTitle ? (
      <p aria-live="assertive" className={errorClass} role="alert">
        {errors.koTitle}
      </p>
    ) : null}
    {errors.koBody ? (
      <p aria-live="assertive" className={errorClass} role="alert">
        {errors.koBody}
      </p>
    ) : null}
  </div>
);

ResumePublishStatusSectionBase.displayName = 'ResumePublishStatusSection';

export const ResumePublishStatusSection = React.memo(ResumePublishStatusSectionBase);

/**
 * 취소와 게시 액션만 담당하는 footer입니다.
 */
const ResumePublishFooterBase = ({
  isCheckingPdfStatus,
  isSubmitting,
  isUploading,
  onCancel,
  onSubmit,
}: ResumePublishFooterProps) => (
  <footer className={footerClass}>
    <Button onClick={onCancel} size="sm" variant="ghost">
      취소
    </Button>
    <Button
      disabled={isSubmitting || isUploading || isCheckingPdfStatus}
      onClick={onSubmit}
      size="sm"
      tone="primary"
    >
      {isSubmitting ? '게시 중...' : '게시하기'}
    </Button>
  </footer>
);

ResumePublishFooterBase.displayName = 'ResumePublishFooter';

export const ResumePublishFooter = React.memo(ResumePublishFooterBase);

const sectionClass = css({
  display: 'grid',
  gap: '5',
  alignContent: 'start',
});

const rowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const copyGroupClass = css({
  display: 'grid',
  gap: '1',
});

const sectionLabelClass = css({
  m: '0',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'muted',
});

const fileNameClass = css({
  m: '0',
  fontSize: 'lg',
  fontWeight: 'semibold',
  wordBreak: 'break-all',
});

const uploadButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '[2.375rem]',
  px: '3',
  borderRadius: 'full',
  border: '[1px solid var(--colors-border)]',
  borderColor: 'border',
  fontSize: 'sm',
  fontWeight: 'semibold',
  cursor: 'pointer',
});

const fileInputClass = css({
  position: 'absolute',
  width: '[1px]',
  height: '[1px]',
  overflow: 'hidden',
  clip: '[rect(0,0,0,0)]',
});

const metaGridClass = css({
  display: 'grid',
  gap: '3',
});

const metaItemClass = css({
  display: 'grid',
  gap: '1',
});

const metaLabelClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const metaValueClass = css({
  fontSize: 'sm',
  fontFamily: 'mono',
  wordBreak: 'break-all',
});

const errorClass = css({
  m: '0',
  fontSize: 'sm',
  color: 'error',
});

const footerClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '3',
});
