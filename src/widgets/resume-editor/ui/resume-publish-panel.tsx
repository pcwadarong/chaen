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
import { SlideOver } from '@/shared/ui/slide-over/slide-over';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { XButton } from '@/shared/ui/x-button/x-button';
import type { ResumePublishPanelProps } from '@/widgets/resume-editor/ui/resume-editor.types';
import {
  ResumePublishFooter,
  ResumePublishStatusSection,
} from '@/widgets/resume-editor/ui/resume-publish-panel-sections';

type ResumePublishErrors = {
  koBody?: string;
  koTitle?: string;
  pdf?: string;
};

const defaultUploadResumePdfFile = async (_file: File): Promise<ResumePublishSettings> => {
  throw createResumeEditorError('pdfUploadNotConfigured');
};

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
  const [isCheckingPdfStatus, setIsCheckingPdfStatus] = useState(false);
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

  useEffect(() => {
    if (!isOpen) return;

    const abortController = new AbortController();

    const loadPdfAvailability = async () => {
      setIsCheckingPdfStatus(true);

      try {
        const response = await fetch('/api/pdf/availability/resume', {
          method: 'GET',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load resume PDF availability: ${response.status}`);
        }

        const data = (await response.json()) as {
          isPdfReady: boolean;
          kind: 'resume';
        };

        setSettings(previous => ({
          ...previous,
          isPdfReady: previous.isPdfReady || data.isPdfReady,
        }));
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('[resume-publish] availability fetch failed', {
          error,
        });
      } finally {
        if (!abortController.signal.aborted) {
          setIsCheckingPdfStatus(false);
        }
      }
    };

    void loadPdfAvailability();

    return () => {
      abortController.abort();
    };
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
            isCheckingPdfStatus={isCheckingPdfStatus}
            isUploading={isUploading}
            onFileChange={handleFileChange}
            settings={settings}
          />
          <ResumePublishFooter
            isCheckingPdfStatus={isCheckingPdfStatus}
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
