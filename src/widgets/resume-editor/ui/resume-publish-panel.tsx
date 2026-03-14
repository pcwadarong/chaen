'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { css } from 'styled-system/css';

import type { ResumePublishSettings } from '@/entities/resume/model/resume-editor.types';
import { validateResumePublishState } from '@/entities/resume/model/resume-editor.utils';
import {
  createResumeEditorError,
  parseResumeEditorError,
  resolveResumePublishInlineErrorField,
  RESUME_EDITOR_ERROR_MESSAGE,
} from '@/entities/resume/model/resume-editor-error';
import { Button } from '@/shared/ui/button/button';
import { SlideOver } from '@/shared/ui/slide-over/slide-over';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { XButton } from '@/shared/ui/x-button/x-button';

import type { ResumePublishPanelProps } from '../model/resume-editor.types';

type ResumePublishErrors = {
  koBody?: string;
  koTitle?: string;
  pdf?: string;
};

type ResumePublishStatusSectionProps = {
  errors: ResumePublishErrors;
  isUploading: boolean;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  settings: ResumePublishSettings;
};

type ResumePublishFooterProps = {
  isSubmitting: boolean;
  isUploading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

const defaultUploadResumePdfFile = async (_file: File): Promise<ResumePublishSettings> => {
  throw createResumeEditorError('pdfUploadNotConfigured');
};

/**
 * 현재 게시 대상 PDF 정보와 업로드 상태를 보여주는 섹션입니다.
 */
const ResumePublishStatusSectionBase = ({
  errors,
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
        <span className={metaValueClass}>
          {settings.isPdfReady ? '업로드됨' : 'PDF 업로드 필요'}
        </span>
      </div>
    </div>
    {errors.pdf ? <p className={errorClass}>{errors.pdf}</p> : null}
    {errors.koTitle ? <p className={errorClass}>{errors.koTitle}</p> : null}
    {errors.koBody ? <p className={errorClass}>{errors.koBody}</p> : null}
  </div>
);

ResumePublishStatusSectionBase.displayName = 'ResumePublishStatusSection';

const ResumePublishStatusSection = React.memo(ResumePublishStatusSectionBase);

/**
 * 취소와 게시 액션만 담당하는 footer입니다.
 */
const ResumePublishFooterBase = ({
  isSubmitting,
  isUploading,
  onCancel,
  onSubmit,
}: ResumePublishFooterProps) => (
  <footer className={footerClass}>
    <Button onClick={onCancel} size="sm" variant="ghost">
      취소
    </Button>
    <Button disabled={isSubmitting || isUploading} onClick={onSubmit} size="sm" tone="primary">
      {isSubmitting ? '게시 중...' : '게시하기'}
    </Button>
  </footer>
);

ResumePublishFooterBase.displayName = 'ResumePublishFooter';

const ResumePublishFooter = React.memo(ResumePublishFooterBase);

/**
 * resume 게시 전 PDF 업로드 상태를 확인하고 최종 제출을 담당합니다.
 */
export const ResumePublishPanel = ({
  editorState,
  initialSettings,
  isOpen,
  onClose,
  onSubmit,
  onUploadPdf = defaultUploadResumePdfFile,
}: ResumePublishPanelProps) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const latestInitialSettingsRef = useRef(initialSettings);
  const previousIsOpenRef = useRef(isOpen);
  const [settings, setSettings] = useState(initialSettings);
  const [errors, setErrors] = useState<ResumePublishErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    latestInitialSettingsRef.current = initialSettings;
  }, [initialSettings]);

  useEffect(() => {
    const wasOpen = previousIsOpenRef.current;
    previousIsOpenRef.current = isOpen;

    if (!isOpen || wasOpen) {
      return;
    }

    setSettings(latestInitialSettingsRef.current);
    setErrors({});
  }, [isOpen]);

  /**
   * 오류 토스트를 추가합니다.
   */
  const pushToast = useCallback((message: string) => {
    setToastItems(previous => [
      ...previous,
      {
        id: `resume-publish-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        tone: 'error',
      },
    ]);
  }, []);

  /**
   * 토스트를 닫습니다.
   */
  const handleToastClose = useCallback((id: string) => {
    setToastItems(previous => previous.filter(item => item.id !== id));
  }, []);

  /**
   * 슬라이드오버를 닫습니다.
   */
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * PDF 업로드 후 게시 설정의 준비 상태를 갱신합니다.
   */
  const handleFileChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    async event => {
      const input = event.target;
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      setIsUploading(true);
      setErrors(previous => ({
        ...previous,
        pdf: undefined,
      }));

      try {
        const nextSettings = await onUploadPdf(file);

        setSettings(nextSettings);
      } catch (error) {
        const parsedError = parseResumeEditorError(error, 'pdfUploadFailed');

        pushToast(parsedError.message);
        setErrors(previous => ({
          ...previous,
          pdf:
            resolveResumePublishInlineErrorField(parsedError.code) === 'pdf'
              ? parsedError.message
              : RESUME_EDITOR_ERROR_MESSAGE.pdfUploadFailed,
        }));
      } finally {
        setIsUploading(false);
        input.value = '';
      }
    },
    [onUploadPdf, pushToast],
  );

  /**
   * 현재 게시 상태를 검증한 뒤 제출 callback을 실행합니다.
   */
  const handleSubmit = useCallback(async () => {
    const nextErrors = validateResumePublishState({
      contents: editorState.contents,
      settings,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(settings);
      handleClose();
    } catch (error) {
      const parsedError = parseResumeEditorError(error, 'publishFailed');
      const inlineField = resolveResumePublishInlineErrorField(parsedError.code);

      if (inlineField) {
        setErrors(previous => ({
          ...previous,
          [inlineField]: parsedError.message,
        }));
        return;
      }

      pushToast(parsedError.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [editorState.contents, handleClose, onSubmit, pushToast, settings]);

  /**
   * 버튼 클릭에서 async submit을 위임합니다.
   */
  const handleSubmitClick = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  return (
    <>
      <SlideOver
        ariaLabel="이력서 게시 설정"
        initialFocusRef={closeButtonRef}
        isOpen={isOpen}
        onClose={handleClose}
      >
        <section className={panelClass}>
          <header className={headerClass}>
            <div className={headerCopyClass}>
              <h2 className={titleClass}>이력서 게시 설정</h2>
              <p className={descriptionClass}>현재 다운로드 파일과 PDF 준비 상태를 확인합니다.</p>
            </div>
            <XButton ariaLabel="닫기" onClick={handleClose} ref={closeButtonRef} />
          </header>

          <ResumePublishStatusSection
            errors={errors}
            isUploading={isUploading}
            onFileChange={handleFileChange}
            settings={settings}
          />
          <ResumePublishFooter
            isSubmitting={isSubmitting}
            isUploading={isUploading}
            onCancel={handleClose}
            onSubmit={handleSubmitClick}
          />
        </section>
      </SlideOver>

      <ToastViewport items={toastItems} onClose={handleToastClose} />
    </>
  );
};

const panelClass = css({
  width: '[min(100vw,30rem)]',
  height: 'full',
  display: 'grid',
  gridTemplateRows: '[auto_1fr_auto]',
  gap: '6',
  bg: 'surface',
  px: '5',
  py: '5',
  borderLeft: '[1px solid var(--colors-border)]',
});

const headerClass = css({
  display: 'grid',
  gridTemplateColumns: '[minmax(0,1fr)_auto]',
  alignItems: 'start',
  gap: '4',
});

const headerCopyClass = css({
  display: 'grid',
  gap: '2',
});

const titleClass = css({
  m: '0',
  fontSize: '2xl',
  lineHeight: 'tight',
});

const descriptionClass = css({
  m: '0',
  color: 'muted',
  fontSize: 'sm',
});

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
