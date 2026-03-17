'use client';

import React, { useRef, useState } from 'react';
import { css } from 'styled-system/css';

import { uploadPdfFileByAssetKey } from '@/entities/pdf-file/api/upload-pdf-file-by-asset-key';
import type { PdfFileAssetKey } from '@/entities/pdf-file/model/types';
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
 * 업로드 성공 직후 사용자에게 보여줄 상태 메시지를 만듭니다.
 */
const createUploadSuccessMessage = (title: string) => `${title} 파일을 최신 PDF로 교체했습니다.`;

/**
 * 업로드 실패 시 사용자에게 보여줄 기본 오류 메시지를 만듭니다.
 */
const createUploadErrorMessage = (title: string) =>
  `${title} 파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.`;

/**
 * 대시보드에서 PDF 자산 4종을 개별 업로드/다운로드 확인할 수 있는 관리자 패널입니다.
 */
export const AdminPdfUploadPanel = ({ initialItems }: AdminPdfUploadPanelProps) => {
  const inputRefs = useRef<Partial<Record<PdfFileAssetKey, HTMLInputElement | null>>>({});
  const [items, setItems] = useState(initialItems);
  const [feedbackByAssetKey, setFeedbackByAssetKey] = useState<
    Partial<Record<PdfFileAssetKey, UploadFeedback>>
  >({});
  const [uploadingByAssetKey, setUploadingByAssetKey] = useState<
    Partial<Record<PdfFileAssetKey, boolean>>
  >({});

  /**
   * 파일 선택 버튼에서 숨겨진 input 클릭을 위임합니다.
   */
  const handleUploadButtonClick = (assetKey: PdfFileAssetKey) => {
    inputRefs.current[assetKey]?.click();
  };

  /**
   * 선택된 PDF 파일을 업로드하고 카드 상태를 최신 결과로 갱신합니다.
   */
  const handleFileChange =
    (item: AdminPdfUploadItem): React.ChangeEventHandler<HTMLInputElement> =>
    async event => {
      const input = event.target;
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      setUploadingByAssetKey(previous => ({
        ...previous,
        [item.assetKey]: true,
      }));
      setFeedbackByAssetKey(previous => ({
        ...previous,
        [item.assetKey]: undefined,
      }));

      try {
        const uploadedSettings = await uploadPdfFileByAssetKey({
          assetKey: item.assetKey,
          file,
        });

        setItems(previous =>
          previous.map(previousItem =>
            previousItem.assetKey === uploadedSettings.assetKey
              ? {
                  ...previousItem,
                  ...uploadedSettings,
                }
              : previousItem,
          ),
        );
        setFeedbackByAssetKey(previous => ({
          ...previous,
          [item.assetKey]: {
            message: createUploadSuccessMessage(item.title),
            tone: 'success',
          },
        }));
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : createUploadErrorMessage(item.title);

        setFeedbackByAssetKey(previous => ({
          ...previous,
          [item.assetKey]: {
            message,
            tone: 'error',
          },
        }));
      } finally {
        setUploadingByAssetKey(previous => ({
          ...previous,
          [item.assetKey]: false,
        }));
        input.value = '';
      }
    };

  return (
    <section aria-labelledby="admin-pdf-upload-title" className={sectionClass}>
      <h2 className={sectionTitleClass} id="admin-pdf-upload-title">
        PDF 파일 관리
      </h2>
      <div className={rowListClass}>
        {items.map(item => {
          const isUploading = uploadingByAssetKey[item.assetKey] === true;
          const feedback = feedbackByAssetKey[item.assetKey];

          return (
            <AdminPdfUploadRow
              feedback={feedback}
              isUploading={isUploading}
              item={item}
              key={item.assetKey}
              onUploadButtonClick={handleUploadButtonClick}
            >
              <input
                accept="application/pdf"
                aria-label={`${item.title} 파일 선택`}
                className={hiddenInputClass}
                disabled={isUploading}
                onChange={handleFileChange(item)}
                ref={element => {
                  inputRefs.current[item.assetKey] = element;
                }}
                type="file"
              />
            </AdminPdfUploadRow>
          );
        })}
      </div>
    </section>
  );
};

type AdminPdfUploadRowProps = {
  children: React.ReactNode;
  feedback?: UploadFeedback;
  isUploading: boolean;
  item: AdminPdfUploadItem;
  onUploadButtonClick: (assetKey: PdfFileAssetKey) => void;
};

/**
 * 하나의 PDF 자산 업로드/다운로드 확인 행입니다.
 */
const AdminPdfUploadRow = ({
  children,
  feedback,
  isUploading,
  item,
  onUploadButtonClick,
}: AdminPdfUploadRowProps) => (
  <article className={rowClass}>
    <div className={rowMainClass}>
      <div className={rowCopyClass}>
        <h3 className={rowTitleClass}>{item.title}</h3>
        <p className={fileNameClass}>{item.downloadFileName}</p>
      </div>
      <div className={actionRowClass}>
        <Button
          className={actionButtonClass}
          disabled={isUploading}
          onClick={() => onUploadButtonClick(item.assetKey)}
          tone="white"
          type="button"
          variant="solid"
        >
          {isUploading ? '업로드 중...' : '업로드'}
        </Button>
        {item.isPdfReady ? (
          <Button asChild className={actionButtonClass} tone="black" variant="solid">
            <a href={item.downloadPath} rel="noopener noreferrer" target="_blank">
              다운로드 확인
            </a>
          </Button>
        ) : (
          <Button className={actionButtonClass} disabled tone="black" type="button" variant="solid">
            다운로드 확인
          </Button>
        )}
      </div>
    </div>

    {children}

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

const sectionClass = css({
  display: 'grid',
  gap: '4',
});

const sectionTitleClass = css({
  m: '0',
  fontSize: 'xl',
  lineHeight: 'tight',
});

const rowListClass = css({
  display: 'grid',
  gap: '3',
});

const rowClass = css({
  display: 'grid',
  gap: '3',
  p: '4',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  borderRadius: '2xl',
  bg: 'surface',
});

const rowMainClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4',
  '@media (max-width: 768px)': {
    alignItems: 'start',
    flexDirection: 'column',
  },
});

const rowCopyClass = css({
  display: 'grid',
  gap: '1',
  minWidth: '0',
});

const rowTitleClass = css({
  m: '0',
  fontSize: 'md',
  lineHeight: 'tight',
});

const fileNameClass = css({
  m: '0',
  fontSize: 'sm',
  color: 'muted',
  lineHeight: 'relaxed',
  wordBreak: 'break-all',
});

const actionRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
  flex: 'none',
  justifyContent: 'flex-end',
  '@media (max-width: 768px)': {
    width: 'full',
    justifyContent: 'flex-start',
  },
});

const actionButtonClass = css({
  minWidth: '[8.5rem]',
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

/**
 * 업로드 피드백 tone에 맞춰 텍스트 스타일 클래스를 반환합니다.
 *
 * @param tone - 피드백 종류입니다. `success`면 성공, `error`면 오류 스타일을 적용합니다.
 * @returns Panda CSS 클래스 이름입니다.
 */
const feedbackTextClass = ({ tone }: { tone: UploadFeedback['tone'] }) =>
  css({
    m: '0',
    fontSize: 'sm',
    color: tone === 'success' ? 'green.700' : 'error',
    lineHeight: 'relaxed',
  });
