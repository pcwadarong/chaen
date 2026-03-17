'use client';

import React, { useRef, useState } from 'react';
import { css } from 'styled-system/css';

import { uploadPdfFileByKind } from '@/entities/pdf-file/api/upload-pdf-file-by-kind';
import type { PdfFileKind } from '@/entities/pdf-file/model/types';
import { Button } from '@/shared/ui/button/button';
import type { AdminPdfUploadItem } from '@/widgets/admin-pdf-upload/model/admin-pdf-upload.types';

type AdminPdfUploadPanelProps = {
  initialItems: AdminPdfUploadItem[];
};

type UploadFeedback = {
  message: string;
  tone: 'error' | 'success';
};

/**
 * 관리자 대시보드에서 노출할 PDF 종류별 한국어 라벨을 반환합니다.
 */
const getPdfKindLabel = (kind: PdfFileKind) => (kind === 'resume' ? '이력서' : '포트폴리오');

/**
 * 업로드 성공 직후 사용자에게 보여줄 상태 메시지를 만듭니다.
 */
const createUploadSuccessMessage = (kind: PdfFileKind) =>
  `${getPdfKindLabel(kind)} PDF를 최신 파일로 교체했습니다.`;

/**
 * 업로드 실패 시 사용자에게 보여줄 기본 오류 메시지를 만듭니다.
 */
const createUploadErrorMessage = (kind: PdfFileKind) =>
  `${getPdfKindLabel(kind)} PDF 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.`;

/**
 * 대시보드에서 resume/portfolio PDF를 즉시 교체 업로드할 수 있는 관리자 패널입니다.
 */
export const AdminPdfUploadPanel = ({ initialItems }: AdminPdfUploadPanelProps) => {
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const portfolioInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState(initialItems);
  const [feedbackByKind, setFeedbackByKind] = useState<
    Partial<Record<PdfFileKind, UploadFeedback>>
  >({});
  const [uploadingKind, setUploadingKind] = useState<PdfFileKind | null>(null);

  /**
   * PDF 종류에 맞는 파일 input ref를 반환합니다.
   */
  const getInputRef = (kind: PdfFileKind) =>
    kind === 'resume' ? resumeInputRef : portfolioInputRef;

  /**
   * 파일 선택 버튼에서 숨겨진 input 클릭을 위임합니다.
   */
  const handleUploadButtonClick = (kind: PdfFileKind) => {
    getInputRef(kind).current?.click();
  };

  /**
   * 선택된 PDF 파일을 업로드하고 카드 상태를 최신 결과로 갱신합니다.
   */
  const handleFileChange =
    (kind: PdfFileKind): React.ChangeEventHandler<HTMLInputElement> =>
    async event => {
      const input = event.target;
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      setUploadingKind(kind);
      setFeedbackByKind(previous => ({
        ...previous,
        [kind]: undefined,
      }));

      try {
        const uploadedSettings = await uploadPdfFileByKind({
          file,
          kind,
        });

        setItems(previous =>
          previous.map(item =>
            item.kind === kind
              ? {
                  ...item,
                  ...uploadedSettings,
                }
              : item,
          ),
        );
        setFeedbackByKind(previous => ({
          ...previous,
          [kind]: {
            message: createUploadSuccessMessage(kind),
            tone: 'success',
          },
        }));
      } catch (error) {
        const message =
          error instanceof Error && error.message ? error.message : createUploadErrorMessage(kind);

        setFeedbackByKind(previous => ({
          ...previous,
          [kind]: {
            message,
            tone: 'error',
          },
        }));
      } finally {
        setUploadingKind(null);
        input.value = '';
      }
    };

  return (
    <section aria-labelledby="admin-pdf-upload-title" className={sectionClass}>
      <div className={cardGridClass}>
        {items.map(item => {
          const isUploading = uploadingKind === item.kind;
          const feedback = feedbackByKind[item.kind];

          return (
            <article className={cardClass} key={item.kind}>
              <div className={cardHeaderClass}>
                <h3 className={cardTitleClass}>{item.title}</h3>
                <span className={statusBadgeClass({ ready: item.isPdfReady })}>
                  {isUploading ? '업로드 중...' : item.isPdfReady ? '업로드됨' : '업로드 필요'}
                </span>
              </div>

              <dl className={metaListClass}>
                <div className={metaRowClass}>
                  <dt className={metaLabelClass}>고정 파일명</dt>
                  <dd className={metaValueClass}>{item.downloadFileName}</dd>
                </div>
                <div className={metaRowClass}>
                  <dt className={metaLabelClass}>Storage 경로</dt>
                  <dd className={metaValueClass}>{item.filePath}</dd>
                </div>
              </dl>

              <div className={actionRowClass}>
                <Button
                  className={actionButtonClass}
                  disabled={isUploading}
                  onClick={() => handleUploadButtonClick(item.kind)}
                  tone="primary"
                  type="button"
                  variant="solid"
                >
                  {isUploading
                    ? `${getPdfKindLabel(item.kind)} PDF 업로드 중...`
                    : `${getPdfKindLabel(item.kind)} PDF 업로드`}
                </Button>
                {item.isPdfReady ? (
                  <Button asChild className={actionButtonClass} tone="white" variant="solid">
                    <a href={item.downloadPath} rel="noopener noreferrer" target="_blank">
                      다운로드 확인
                    </a>
                  </Button>
                ) : null}
              </div>

              <input
                accept="application/pdf"
                aria-label={`${getPdfKindLabel(item.kind)} PDF 파일 선택`}
                className={hiddenInputClass}
                disabled={isUploading}
                onChange={handleFileChange(item.kind)}
                ref={getInputRef(item.kind)}
                type="file"
              />

              {feedback ? (
                <p
                  aria-live={feedback.tone === 'success' ? 'polite' : 'assertive'}
                  className={feedbackTextClass({ tone: feedback.tone })}
                  role={feedback.tone === 'error' ? 'alert' : 'status'}
                >
                  {feedback.message}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
};

const sectionClass = css({
  display: 'grid',
  gap: '4',
});

const cardGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '4',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
  },
});

const cardClass = css({
  display: 'grid',
  gap: '4',
  p: '4',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  borderRadius: '2xl',
  bg: 'surface',
});

const cardHeaderClass = css({
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: '3',
});

const cardTitleClass = css({
  m: '0',
  fontSize: 'lg',
  lineHeight: 'tight',
});

const statusBadgeClass = ({ ready }: { ready: boolean }) =>
  css({
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '8',
    px: '3',
    borderRadius: 'full',
    fontSize: 'xs',
    fontWeight: '[700]',
    color: ready ? 'green.700' : 'orange.700',
    bg: ready ? 'green.50' : 'orange.50',
  });

const metaListClass = css({
  display: 'grid',
  gap: '2',
});

const metaRowClass = css({
  display: 'grid',
  gap: '1',
});

const metaLabelClass = css({
  fontSize: 'xs',
  fontWeight: '[700]',
  color: 'muted',
});

const metaValueClass = css({
  m: '0',
  fontSize: 'sm',
  lineHeight: 'relaxed',
  wordBreak: 'break-all',
});

const actionRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
});

const actionButtonClass = css({
  minWidth: '[9rem]',
});

const hiddenInputClass = css({
  position: 'absolute',
  width: '[1px]',
  height: '[1px]',
  p: '0',
  m: '[-1px]',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
});

const feedbackTextClass = ({ tone }: { tone: UploadFeedback['tone'] }) =>
  css({
    m: '0',
    fontSize: 'sm',
    color: tone === 'success' ? 'green.700' : 'error',
    lineHeight: 'relaxed',
  });
