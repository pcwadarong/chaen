'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import { PHOTO_FILE_ALLOWED_MIME_TYPES } from '@/entities/hero-photo/model/config';
import type { PhotoFileItem } from '@/entities/hero-photo/model/types';
import { optimizeAdminPhotoFile } from '@/shared/lib/image/optimize-admin-photo-file';
import { XButton } from '@/shared/ui/x-button/x-button';

type AdminPhotoLibraryPanelProps = {
  initialItems: PhotoFileItem[];
};

type PanelFeedback = {
  message: string;
  tone: 'error' | 'success';
};

const PHOTO_FILE_INPUT_ACCEPT = [
  ...PHOTO_FILE_ALLOWED_MIME_TYPES,
  '.heic',
  '.heif',
  '.jpg',
  '.jpeg',
  '.png',
].join(',');

const PHOTO_FILE_ALLOWED_FORMAT_GUIDE = Array.from(
  new Set(
    PHOTO_FILE_INPUT_ACCEPT.split(',').map(token =>
      token
        .trim()
        .replace(/^image\//, '')
        .replace(/^\./, '')
        .toUpperCase(),
    ),
  ),
).join(', ');

/**
 * 업로드 응답이 사진 카드 계약과 일치하는지 확인합니다.
 */
const isPhotoUploadResponse = (value: unknown): value is { item: PhotoFileItem } =>
  typeof value === 'object' &&
  value !== null &&
  'item' in value &&
  typeof value.item === 'object' &&
  value.item !== null &&
  'fileName' in value.item &&
  'filePath' in value.item &&
  'publicUrl' in value.item;

/**
 * 삭제 응답에서 실제로 제거된 파일 경로를 읽을 수 있는지 확인합니다.
 */
const isPhotoDeleteResponse = (value: unknown): value is { filePath: string } =>
  typeof value === 'object' &&
  value !== null &&
  'filePath' in value &&
  typeof value.filePath === 'string';

/**
 * 업로드 성공 개수와 실패 개수를 바탕으로 상태 메시지를 조합합니다.
 */
const createUploadFeedbackMessage = ({
  failedCount,
  uploadedCount,
}: {
  failedCount: number;
  uploadedCount: number;
}) => {
  if (uploadedCount > 0 && failedCount === 0) {
    return `${uploadedCount}장의 사진을 업로드했습니다.`;
  }

  if (uploadedCount > 0 && failedCount > 0) {
    return `${uploadedCount}장의 사진을 업로드했고 ${failedCount}장은 실패했습니다.`;
  }

  return '사진 업로드에 실패했습니다.';
};

/**
 * 바이트 크기를 사람이 읽기 쉬운 KB/MB 텍스트로 변환합니다.
 */
const formatPhotoFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))}KB`;
};

/**
 * 관리자 전용 사진 보관함에서 다중 업로드, 삭제, 미리보기를 제공합니다.
 */
export const AdminPhotoLibraryPanel = ({ initialItems }: AdminPhotoLibraryPanelProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<PanelFeedback | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [deletingFilePath, setDeletingFilePath] = useState<string | null>(null);

  /**
   * 선택한 사진들을 순서대로 업로드해 현재 리스트 뒤에 붙입니다.
   */
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async event => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    let uploadedCount = 0;
    let failedCount = 0;

    for (const file of selectedFiles) {
      try {
        const optimizedFile = await optimizeAdminPhotoFile(file).catch(() => file);
        const formData = new FormData();

        formData.set('file', optimizedFile);

        const response = await fetch('/api/photos', {
          body: formData,
          method: 'POST',
        });
        const body = (await response.json().catch(() => null)) as unknown;

        if (!response.ok || !isPhotoUploadResponse(body)) {
          failedCount += 1;
          continue;
        }

        uploadedCount += 1;
        setItems(previous => [...previous, body.item]);
      } catch {
        failedCount += 1;
      }
    }

    setFeedback({
      message: createUploadFeedbackMessage({
        failedCount,
        uploadedCount,
      }),
      tone: uploadedCount > 0 ? 'success' : 'error',
    });
    setIsUploading(false);
    event.target.value = '';
  };

  /**
   * 카드 삭제 버튼을 누르면 확인 후 Storage 객체를 제거하고 리스트에서 제외합니다.
   */
  const handleDeleteClick = async (item: PhotoFileItem) => {
    if (!window.confirm(`"${item.fileName}" 사진을 삭제할까요?`)) {
      return;
    }

    setDeletingFilePath(item.filePath);
    setFeedback(null);

    try {
      const response = await fetch('/api/photos', {
        body: JSON.stringify({
          filePath: item.filePath,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'DELETE',
      });
      const body = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !isPhotoDeleteResponse(body)) {
        const errorMessage =
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof body.error === 'string'
            ? body.error
            : '삭제에 실패했습니다.';

        throw new Error(errorMessage);
      }

      setItems(previous =>
        previous.filter(previousItem => previousItem.filePath !== body.filePath),
      );
      setFeedback({
        message: '사진을 삭제했습니다.',
        tone: 'success',
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : '삭제에 실패했습니다.';

      setFeedback({
        message,
        tone: 'error',
      });
    } finally {
      setDeletingFilePath(null);
    }
  };

  return (
    <section aria-label="사진 보관함" className={sectionClass}>
      <input
        accept={PHOTO_FILE_INPUT_ACCEPT}
        aria-label="사진 파일 선택"
        className={hiddenInputClass}
        disabled={isUploading}
        multiple
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      {feedback ? (
        <p
          aria-live="polite"
          className={cx(feedbackClass, feedback.tone === 'error' ? feedbackErrorClass : undefined)}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className={emptyStateClass}>
          <p className={emptyStateTitleClass}>아직 업로드된 사진이 없습니다.</p>
          <p className={emptyStateDescriptionClass}>
            {`${PHOTO_FILE_ALLOWED_FORMAT_GUIDE} 형식으로 여러 장 업로드할 수 있습니다.`}
          </p>
        </div>
      ) : (
        <div className={photoGridClass}>
          {items.map(item => (
            <AdminPhotoCard
              isDeleting={deletingFilePath === item.filePath}
              item={item}
              key={item.filePath}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}
    </section>
  );
};

type AdminPhotoCardProps = {
  isDeleting: boolean;
  item: PhotoFileItem;
  onDelete: (item: PhotoFileItem) => void;
};

/**
 * 업로드된 사진 하나를 미리보기 카드로 표시합니다.
 */
const AdminPhotoCard = ({ isDeleting, item, onDelete }: AdminPhotoCardProps) => {
  const [isPreviewFailed, setIsPreviewFailed] = useState(false);

  return (
    <figure aria-label={item.fileName} className={photoCardClass}>
      <div className={photoPreviewFrameClass}>
        <XButton
          ariaLabel={`${item.fileName} 삭제`}
          className={deleteButtonClass}
          disabled={isDeleting}
          onClick={() => onDelete(item)}
          size="xs"
          tone="white"
          variant="solid"
        />
        {isPreviewFailed ? (
          <div aria-hidden="true" className={photoFallbackClass}>
            <span className={photoFallbackExtensionClass}>
              {item.fileName.split('.').pop()?.toUpperCase() ?? 'IMG'}
            </span>
          </div>
        ) : (
          <Image
            alt={item.fileName}
            className={photoImageClass}
            fill
            onError={() => setIsPreviewFailed(true)}
            sizes="(max-width: 48rem) 100vw, 18rem"
            src={item.publicUrl}
          />
        )}
      </div>
      <figcaption className={photoMetaClass}>
        <p className={photoFileNameClass}>{item.fileName}</p>
        <p className={photoInfoClass}>
          {formatPhotoFileSize(item.size)} · {item.mimeType}
        </p>
      </figcaption>
    </figure>
  );
};

const sectionClass = css({
  display: 'grid',
  gap: '3',
});

const hiddenInputClass = css({
  display: 'none',
});

const feedbackClass = css({
  fontSize: 'sm',
  color: 'primary',
});

const feedbackErrorClass = css({
  color: 'error',
});

const emptyStateClass = css({
  display: 'grid',
  gap: '2',
  borderRadius: '3xl',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'border',
  background: 'surfaceMuted',
  px: '6',
  py: '8',
  textAlign: 'center',
});

const emptyStateTitleClass = css({
  fontSize: 'md',
  fontWeight: 'semibold',
});

const emptyStateDescriptionClass = css({
  color: 'muted',
  fontSize: 'sm',
});

const photoGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
  gap: '3',
});

const photoCardClass = css({
  display: 'grid',
  gap: '2.5',
  borderRadius: '2xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
  p: '3',
});

const photoPreviewFrameClass = css({
  position: 'relative',
  aspectRatio: '[16 / 9]',
  overflow: 'hidden',
  borderRadius: 'xl',
  background: 'surfaceMuted',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
});

const deleteButtonClass = css({
  position: 'absolute',
  top: '3',
  right: '3',
  zIndex: '1',
  boxShadow: 'floating',
});

const photoImageClass = css({
  objectFit: 'cover',
});

const photoFallbackClass = css({
  width: 'full',
  height: 'full',
  display: 'grid',
  placeItems: 'center',
  background: 'surfaceMuted',
});

const photoFallbackExtensionClass = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  letterSpacing: 'widest',
  color: 'muted',
});

const photoMetaClass = css({
  display: 'grid',
  gap: '0.5',
  minWidth: '0',
});

const photoFileNameClass = css({
  lineClamp: '2',
  fontSize: 'sm',
  fontWeight: 'semibold',
});

const photoInfoClass = css({
  color: 'muted',
  fontSize: 'xs',
  lineClamp: '1',
});
