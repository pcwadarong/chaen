'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from 'styled-system/css';

import {
  createEditorError,
  EDITOR_ERROR_MESSAGE,
  parseEditorError,
  resolveEditorPublishInlineErrorField,
} from '@/entities/editor/model/editor-error';
import { optimizeThumbnailImageFile } from '@/shared/lib/image/optimize-thumbnail-image-file';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';
import { SlideOver } from '@/shared/ui/slide-over/slide-over';
import { SlugInput } from '@/shared/ui/slug-input/slug-input';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { XButton } from '@/shared/ui/x-button/x-button';
import type {
  PublishPanelProps,
  PublishSettings,
  PublishVisibility,
} from '@/widgets/editor/model/editor-core.types';
import {
  buildPublishSettings,
  createDefaultPublishSettings,
  toScheduledPublishUtcIso,
  validatePublishSettings,
} from '@/widgets/editor/model/publish-panel.utils';

type PublishMode = 'immediate' | 'scheduled';
type PublishErrors = {
  koTitle?: string;
  publishAt?: string;
  slug?: string;
  thumbnail?: string;
};

type PublishVisibilitySectionProps = {
  onChange: (value: PublishVisibility) => void;
  value: PublishVisibility;
};

type PublishThumbnailSectionProps = {
  error?: string;
  isUploading: boolean;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  onThumbnailUrlChange: (value: string) => void;
  thumbnailPreviewUrl: string;
  thumbnailUrl: string;
};

type PublishScheduleSectionProps = {
  dateInput: string;
  error?: string;
  isScheduleLocked: boolean;
  minDateInput: string;
  minTimeInput?: string;
  onDateChange: (value: string) => void;
  onPublishModeChange: (mode: PublishMode) => void;
  onTimeChange: (value: string) => void;
  publishMode: PublishMode;
  scheduledUtcIso: string | null;
  timeInput: string;
};

const visibilityOptions: Array<{ label: string; value: PublishVisibility }> = [
  { label: '공개', value: 'public' },
  { label: '비공개', value: 'private' },
];

const PublishVisibilitySectionBase = ({ onChange, value }: PublishVisibilitySectionProps) => (
  <section className={sectionClass}>
    <p className={fieldLabelClass}>공개 설정</p>
    <div className={inlineOptionRowClass}>
      {visibilityOptions.map(option => (
        <label className={optionLabelClass} key={option.value}>
          <input
            checked={value === option.value}
            className={radioClass}
            name="publish-visibility"
            onChange={() => onChange(option.value)}
            type="radio"
            value={option.value}
          />
          <span className={optionTitleClass}>{option.label}</span>
        </label>
      ))}
    </div>
  </section>
);

PublishVisibilitySectionBase.displayName = 'PublishVisibilitySection';

const PublishVisibilitySection = React.memo(PublishVisibilitySectionBase);

const PublishThumbnailSectionBase = ({
  error,
  isUploading,
  onFileChange,
  onThumbnailUrlChange,
  thumbnailPreviewUrl,
  thumbnailUrl,
}: PublishThumbnailSectionProps) => (
  <section className={sectionClass}>
    <label className={fieldLabelClass} htmlFor="publish-panel-thumbnail-url">
      썸네일
    </label>
    <div className={thumbnailRowClass}>
      <Input
        className={thumbnailInputClass}
        id="publish-panel-thumbnail-url"
        onChange={event => onThumbnailUrlChange(event.target.value)}
        placeholder="https://example.com/thumbnail.png"
        value={thumbnailUrl}
      />
      <label className={uploadButtonWrapClass}>
        <span className={uploadButtonLabelClass}>
          {isUploading ? '업로드 중...' : '파일 업로드'}
        </span>
        <input
          accept="image/*"
          aria-label="파일 업로드"
          className={fileInputClass}
          disabled={isUploading}
          onChange={onFileChange}
          type="file"
        />
      </label>
    </div>
    {error ? (
      <p className={errorTextClass} role="alert">
        {error}
      </p>
    ) : null}
    {thumbnailPreviewUrl ? (
      <div className={thumbnailPreviewFrameClass}>
        <Image
          alt="썸네일 미리보기"
          className={thumbnailPreviewImageClass}
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          src={thumbnailPreviewUrl}
          unoptimized
        />
      </div>
    ) : null}
  </section>
);

PublishThumbnailSectionBase.displayName = 'PublishThumbnailSection';

const PublishThumbnailSection = React.memo(PublishThumbnailSectionBase);

const PublishScheduleSectionBase = ({
  dateInput,
  error,
  isScheduleLocked,
  minDateInput,
  minTimeInput,
  onDateChange,
  onPublishModeChange,
  onTimeChange,
  publishMode,
  scheduledUtcIso,
  timeInput,
}: PublishScheduleSectionProps) => (
  <section className={sectionClass}>
    <p className={fieldLabelClass}>발행 시간</p>
    <div className={inlineOptionRowClass}>
      <label className={optionLabelClass}>
        <input
          checked={publishMode === 'immediate'}
          className={radioClass}
          name="publish-time"
          onChange={() => onPublishModeChange('immediate')}
          type="radio"
          value="immediate"
        />
        <span className={optionTitleClass}>지금 발행</span>
      </label>
      <label
        className={cx(optionLabelClass, isScheduleLocked ? disabledOptionLabelClass : undefined)}
      >
        <input
          checked={publishMode === 'scheduled'}
          className={radioClass}
          disabled={isScheduleLocked}
          name="publish-time"
          onChange={() => onPublishModeChange('scheduled')}
          type="radio"
          value="scheduled"
        />
        <span className={optionTitleClass}>예약 발행</span>
      </label>
    </div>
    {isScheduleLocked ? (
      <p className={helperTextClass}>이미 공개된 글은 예약 발행으로 다시 전환할 수 없습니다.</p>
    ) : null}
    {publishMode === 'scheduled' && !isScheduleLocked ? (
      <div className={scheduleFieldGridClass}>
        <label className={scheduleFieldClass}>
          <span className={scheduleLabelClass}>날짜</span>
          <Input
            className={scheduleInputClass}
            min={minDateInput}
            onChange={event => onDateChange(event.target.value)}
            type="date"
            value={dateInput}
          />
        </label>
        <label className={scheduleFieldClass}>
          <span className={scheduleLabelClass}>시간</span>
          <Input
            className={scheduleInputClass}
            min={minTimeInput}
            onChange={event => onTimeChange(event.target.value)}
            type="time"
            value={timeInput}
          />
        </label>
        <p className={utcPreviewClass}>UTC: {scheduledUtcIso ?? '날짜와 시간을 입력해주세요'}</p>
        {error ? (
          <p className={errorTextClass} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    ) : null}
  </section>
);

PublishScheduleSectionBase.displayName = 'PublishScheduleSection';

const PublishScheduleSection = React.memo(PublishScheduleSectionBase);

/**
 * 패널 초기값으로 사용할 로컬 날짜/시간 문자열을 계산합니다.
 */
const getInitialScheduleFields = (publishAt: string | null, now: Date = new Date()) => {
  if (!publishAt) {
    return {
      dateInput: '',
      publishMode: 'immediate' as PublishMode,
      timeInput: '',
    };
  }

  const scheduledDate = new Date(publishAt);

  if (Number.isNaN(scheduledDate.getTime())) {
    return {
      dateInput: '',
      publishMode: 'immediate' as PublishMode,
      timeInput: '',
    };
  }

  if (scheduledDate.getTime() <= now.getTime()) {
    return {
      dateInput: '',
      publishMode: 'immediate' as PublishMode,
      timeInput: '',
    };
  }

  const year = `${scheduledDate.getFullYear()}`;
  const month = `${scheduledDate.getMonth() + 1}`.padStart(2, '0');
  const date = `${scheduledDate.getDate()}`.padStart(2, '0');
  const hours = `${scheduledDate.getHours()}`.padStart(2, '0');
  const minutes = `${scheduledDate.getMinutes()}`.padStart(2, '0');

  return {
    dateInput: `${year}-${month}-${date}`,
    publishMode: 'scheduled' as PublishMode,
    timeInput: `${hours}:${minutes}`,
  };
};

/**
 * 로컬 기준 현재 시각을 date/time input에 넣을 수 있는 최소값 문자열로 반환합니다.
 */
const getLocalScheduleMinFields = (now: Date = new Date()) => {
  const year = `${now.getFullYear()}`;
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const date = `${now.getDate()}`.padStart(2, '0');
  const hours = `${now.getHours()}`.padStart(2, '0');
  const minutes = `${now.getMinutes()}`.padStart(2, '0');

  return {
    minDateInput: `${year}-${month}-${date}`,
    minTimeInput: `${hours}:${minutes}`,
  };
};

/**
 * 패널이 열릴 때 editor 상태와 초기 발행 설정을 form 값으로 동기화합니다.
 */
const createInitialFormState = ({
  editorSlug,
  initialSettings,
}: {
  editorSlug: string;
  initialSettings?: PublishSettings;
}) => {
  const scheduleFields = getInitialScheduleFields(initialSettings?.publishAt ?? null);

  return {
    allowComments: initialSettings?.allowComments ?? true,
    dateInput: scheduleFields.dateInput,
    publishMode: scheduleFields.publishMode,
    slug: initialSettings?.slug ?? editorSlug,
    thumbnailUrl: initialSettings?.thumbnailUrl ?? '',
    timeInput: scheduleFields.timeInput,
    visibility: initialSettings?.visibility ?? 'public',
  };
};

/**
 * 발행 설정이 필드 단위로 같은지 비교합니다.
 */
const isSamePublishSettings = (left: PublishSettings, right: PublishSettings) =>
  left.allowComments === right.allowComments &&
  left.publishAt === right.publishAt &&
  left.slug === right.slug &&
  left.thumbnailUrl === right.thumbnailUrl &&
  left.visibility === right.visibility;

/**
 * 발행 설정을 우측 슬라이드 패널로 편집합니다.
 */
export const PublishPanel = ({
  contentId,
  contentType,
  editorState,
  initialSettings,
  isOpen,
  isPublished = false,
  publicationState = 'draft',
  onClose,
  onSettingsChange,
  onSubmit,
}: PublishPanelProps) => {
  const [slug, setSlug] = useState('');
  const [visibility, setVisibility] = useState<PublishVisibility>('public');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [publishMode, setPublishMode] = useState<PublishMode>('immediate');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [errors, setErrors] = useState<PublishErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const hasInitializedWhileOpenRef = useRef(false);
  const pendingInitialSettingsRef = useRef<PublishSettings | null>(null);
  const openedAtRef = useRef<Date | null>(null);
  const isScheduleLocked = publicationState === 'published';

  useEffect(() => {
    if (!isOpen) {
      hasInitializedWhileOpenRef.current = false;
      pendingInitialSettingsRef.current = null;
      openedAtRef.current = null;
      return;
    }

    if (hasInitializedWhileOpenRef.current) return;

    openedAtRef.current = new Date();

    const nextFormState = createInitialFormState({
      editorSlug: editorState.slug,
      initialSettings: createDefaultPublishSettings({
        initialSettings,
        slug: editorState.slug,
      }),
    });
    const nextSettings = buildPublishSettings(nextFormState);

    hasInitializedWhileOpenRef.current = true;
    pendingInitialSettingsRef.current = nextSettings;

    setSlug(nextFormState.slug);
    setVisibility(nextFormState.visibility);
    setThumbnailUrl(nextFormState.thumbnailUrl);
    setAllowComments(nextFormState.allowComments);
    setPublishMode(nextFormState.publishMode);
    setDateInput(nextFormState.dateInput);
    setTimeInput(nextFormState.timeInput);
    setErrors({});
  }, [editorState.slug, initialSettings, isOpen]);

  useEffect(() => {
    if (!isOpen || !isScheduleLocked || publishMode === 'immediate') return;

    setPublishMode('immediate');
    setDateInput('');
    setTimeInput('');
  }, [isOpen, isScheduleLocked, publishMode]);

  const scheduledUtcIso = useMemo(
    () => toScheduledPublishUtcIso(dateInput, timeInput),
    [dateInput, timeInput],
  );
  const { minDateInput, minTimeInput } = getLocalScheduleMinFields(
    openedAtRef.current ?? new Date(),
  );
  const effectiveMinTimeInput =
    publishMode === 'scheduled' && (!dateInput || dateInput === minDateInput)
      ? minTimeInput
      : undefined;
  const currentSettings = useMemo(
    () =>
      buildPublishSettings({
        allowComments,
        dateInput,
        publishMode,
        slug,
        thumbnailUrl,
        timeInput,
        visibility,
      }),
    [allowComments, dateInput, publishMode, slug, thumbnailUrl, timeInput, visibility],
  );

  const thumbnailPreviewUrl = thumbnailUrl.trim();

  useEffect(() => {
    if (!isOpen || !onSettingsChange) return;

    if (pendingInitialSettingsRef.current) {
      if (!isSamePublishSettings(currentSettings, pendingInitialSettingsRef.current)) {
        return;
      }

      pendingInitialSettingsRef.current = null;
    }

    onSettingsChange(currentSettings);
  }, [currentSettings, isOpen, onSettingsChange]);

  /**
   * 업로드/제출 실패 토스트를 추가합니다.
   */
  const pushToast = useCallback((message: string) => {
    setToastItems(previous => [
      ...previous,
      {
        id: `publish-panel-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        tone: 'error',
      },
    ]);
  }, []);
  const closeToast = useCallback((id: string) => {
    setToastItems(previous => previous.filter(item => item.id !== id));
  }, []);
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  const handleSlugChange = useCallback((value: string) => {
    setSlug(previous => (previous === value ? previous : value));
  }, []);
  const handleThumbnailUrlChange = useCallback((value: string) => {
    setThumbnailUrl(previous => (previous === value ? previous : value));
  }, []);
  const handleAllowCommentsChange = useCallback((checked: boolean) => {
    setAllowComments(previous => (previous === checked ? previous : checked));
  }, []);
  const handleVisibilityChange = useCallback((nextVisibility: PublishVisibility) => {
    setVisibility(previous => (previous === nextVisibility ? previous : nextVisibility));
  }, []);
  const handlePublishModeChange = useCallback((nextMode: PublishMode) => {
    setPublishMode(previous => (previous === nextMode ? previous : nextMode));
  }, []);
  const handleDateInputChange = useCallback((value: string) => {
    setDateInput(previous => (previous === value ? previous : value));
  }, []);
  const handleTimeInputChange = useCallback((value: string) => {
    setTimeInput(previous => (previous === value ? previous : value));
  }, []);

  /**
   * 슬러그 중복 여부를 관리자 확인 API로 검사합니다.
   */
  const handleCheckDuplicate = useCallback(
    async (nextSlug: string) => {
      const searchParams = new URLSearchParams({
        slug: nextSlug,
        type: contentType,
      });

      if (contentId) {
        searchParams.set('excludeId', contentId);
      }

      const response = await fetch(`/api/editor/slug-check?${searchParams.toString()}`);
      const body = (await response.json()) as {
        duplicate?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || typeof body.duplicate !== 'boolean') {
        throw createEditorError(
          'slugCheckFailed',
          body.error ?? body.message ?? EDITOR_ERROR_MESSAGE.slugCheckFailed,
        );
      }

      return body.duplicate;
    },
    [contentId, contentType],
  );

  /**
   * 썸네일 파일을 업로드하고 공개 URL을 form 상태에 반영합니다.
   */
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      const optimizedFile = await optimizeThumbnailImageFile(file);
      const formData = new FormData();
      formData.set('contentType', contentType);
      formData.set('file', optimizedFile);

      setIsUploading(true);
      setErrors(previous => ({ ...previous, thumbnail: undefined }));

      try {
        const response = await fetch('/api/images', {
          body: formData,
          method: 'POST',
        });

        const body = (await response.json()) as { error?: string; message?: string; url?: string };

        if (!response.ok || !body.url) {
          throw createEditorError(
            'thumbnailUploadFailed',
            body.error ?? body.message ?? EDITOR_ERROR_MESSAGE.thumbnailUploadFailed,
          );
        }

        setThumbnailUrl(body.url);
      } catch {
        setErrors(previous => ({
          ...previous,
          thumbnail: EDITOR_ERROR_MESSAGE.thumbnailUploadFailed,
        }));
        pushToast(EDITOR_ERROR_MESSAGE.thumbnailUploadFailedWithRetry);
      } finally {
        setIsUploading(false);
        event.target.value = '';
      }
    },
    [contentType, pushToast],
  );

  /**
   * 현재 form 값으로 최종 발행 설정을 검증한 뒤 제출합니다.
   */
  const handleSubmit = useCallback(async () => {
    const nextSettings = currentSettings;
    const nextErrors = validatePublishSettings({
      editorState,
      settings: nextSettings,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await onSubmit(nextSettings);
      onClose();
    } catch (error) {
      const parsedError = parseEditorError(error, 'publishFailed');
      const inlineField = resolveEditorPublishInlineErrorField(parsedError.code);

      if (inlineField) {
        setErrors(previous => ({
          ...previous,
          [inlineField]: parsedError.message,
        }));
      } else {
        pushToast(parsedError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSettings, editorState, onClose, onSubmit, pushToast]);
  const handleSubmitClick = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  return (
    <>
      <SlideOver
        ariaLabelledBy="publish-panel-title"
        className={panelClass}
        isOpen={isOpen}
        onClose={handleClose}
      >
        <div className={panelHeaderClass}>
          <h2 className={panelTitleClass} id="publish-panel-title">
            발행 설정
          </h2>
          <XButton ariaLabel="발행 설정 닫기" onClick={handleClose} />
        </div>

        <div className={panelBodyClass} onClick={event => event.stopPropagation()}>
          <section className={sectionClass}>
            <SlugInput
              isPublished={isPublished}
              onChange={handleSlugChange}
              onCheckDuplicate={handleCheckDuplicate}
              showEmptyError={errors.slug === EDITOR_ERROR_MESSAGE.missingSlug}
              value={slug}
            />
            {errors.slug ? (
              <p className={errorTextClass} id="publish-panel-slug-error" role="alert">
                {errors.slug}
              </p>
            ) : null}
          </section>

          <PublishVisibilitySection onChange={handleVisibilityChange} value={visibility} />

          <PublishThumbnailSection
            error={errors.thumbnail}
            isUploading={isUploading}
            onFileChange={handleFileChange}
            onThumbnailUrlChange={handleThumbnailUrlChange}
            thumbnailPreviewUrl={thumbnailPreviewUrl}
            thumbnailUrl={thumbnailUrl}
          />

          <section className={sectionClass}>
            <label className={checkboxLabelClass}>
              <input
                checked={allowComments}
                className={checkboxClass}
                onChange={event => handleAllowCommentsChange(event.target.checked)}
                type="checkbox"
              />
              댓글 허용
            </label>
          </section>

          <PublishScheduleSection
            dateInput={dateInput}
            error={errors.publishAt}
            isScheduleLocked={isScheduleLocked}
            minDateInput={minDateInput}
            minTimeInput={effectiveMinTimeInput}
            onDateChange={handleDateInputChange}
            onPublishModeChange={handlePublishModeChange}
            onTimeChange={handleTimeInputChange}
            publishMode={publishMode}
            scheduledUtcIso={scheduledUtcIso}
            timeInput={timeInput}
          />

          {errors.koTitle ? (
            <p className={errorTextClass} role="alert">
              {errors.koTitle}
            </p>
          ) : null}
        </div>

        <div className={panelFooterClass}>
          <Button onClick={handleClose} size="sm" tone="white">
            취소
          </Button>
          <Button disabled={isSubmitting} onClick={handleSubmitClick} size="sm" tone="primary">
            {isSubmitting ? (
              <>
                <span aria-hidden className={loadingSpinnerClass} />
                발행 중...
              </>
            ) : (
              '발행하기'
            )}
          </Button>
        </div>
      </SlideOver>

      <ToastViewport items={toastItems} onClose={closeToast} />
    </>
  );
};

const panelClass = css({
  zIndex: '90',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  width: 'full',
  maxWidth: '[30rem]',
  height: 'dvh',
  bg: 'surface',
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border',
  boxShadow: 'floating',
});

const panelHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '5',
  py: '4',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border',
});

const panelTitleClass = css({
  fontSize: 'xl',
  fontWeight: '[700]',
  letterSpacing: '[-0.02em]',
});

const panelBodyClass = css({
  overflowY: 'auto',
  px: '5',
  py: '5',
  display: 'grid',
  alignContent: 'start',
  gap: '6',
});

const sectionClass = css({
  display: 'grid',
  gap: '3',
});

const fieldLabelClass = css({
  fontSize: 'sm',
  fontWeight: '[700]',
  color: 'text',
});

const inlineOptionRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4',
});

const optionLabelClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  cursor: 'pointer',
});

const disabledOptionLabelClass = css({
  cursor: 'not-allowed',
  opacity: '0.5',
});

const optionTitleClass = css({
  fontSize: 'sm',
  fontWeight: '[600]',
  color: 'text',
});

const radioClass = css({
  flex: 'none',
});

const helperTextClass = css({
  fontSize: 'sm',
  color: 'muted',
  lineHeight: 'relaxed',
});

const thumbnailRowClass = css({
  display: 'flex',
  alignItems: 'stretch',
  gap: '3',
  '@media (max-width: 480px)': {
    flexDirection: 'column',
  },
});

const thumbnailInputClass = css({
  flex: '1',
});

const uploadButtonWrapClass = css({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[fit-content]',
  minHeight: '[2.375rem]',
  px: '3',
  borderRadius: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  bg: 'surface',
  color: 'text',
  cursor: 'pointer',
  flex: 'none',
});

const uploadButtonLabelClass = css({
  fontSize: 'sm',
  fontWeight: '[600]',
});

const fileInputClass = css({
  position: 'absolute',
  inset: '0',
  opacity: '0',
  cursor: 'pointer',
});

const thumbnailPreviewFrameClass = css({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  bg: {
    base: 'gray.50',
    _dark: 'gray.900',
  },
  minHeight: '[12rem]',
});

const thumbnailPreviewImageClass = css({
  display: 'block',
  width: 'full',
  height: '[12rem]',
  objectFit: 'cover',
});

const checkboxLabelClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3',
  fontSize: 'sm',
  fontWeight: '[600]',
  cursor: 'pointer',
});

const checkboxClass = css({
  width: '4',
  height: '4',
});

const scheduleFieldGridClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
});

const scheduleFieldClass = css({
  display: 'grid',
  gap: '2',
  flex: '1',
  minWidth: '[10rem]',
});

const scheduleLabelClass = css({
  fontSize: 'xs',
  color: 'muted',
});

const scheduleInputClass = css({
  width: 'full',
});

const utcPreviewClass = css({
  fontSize: 'xs',
  color: 'muted',
  flexBasis: 'full',
});

const errorTextClass = css({
  fontSize: 'xs',
  color: 'error',
});

const panelFooterClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '3',
  px: '5',
  py: '4',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'border',
});

const loadingSpinnerClass = css({
  display: 'inline-block',
  width: '4',
  height: '4',
  borderRadius: 'full',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: '[rgba(255,255,255,0.45)]',
  borderTopColor: 'white',
  animation: '[spin_0.8s_linear_infinite]',
});
