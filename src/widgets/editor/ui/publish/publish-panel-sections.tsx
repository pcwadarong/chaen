'use client';

import React from 'react';
import { css, cx } from 'styled-system/css';

import { ImageSourceField } from '@/shared/ui/image-source-field';
import { Input } from '@/shared/ui/input/input';
import type { PublishVisibility } from '@/widgets/editor/ui/core/editor-core.types';
import type { PublishMode } from '@/widgets/editor/ui/publish/publish-panel-schedule';

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

type PublishProjectLinksSectionProps = {
  githubUrl: string;
  githubUrlError?: string;
  onGithubUrlChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
  websiteUrl: string;
  websiteUrlError?: string;
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

export const PublishVisibilitySection = React.memo(PublishVisibilitySectionBase);

const PublishThumbnailSectionBase = ({
  error,
  isUploading,
  onFileChange,
  onThumbnailUrlChange,
  thumbnailPreviewUrl,
  thumbnailUrl,
}: PublishThumbnailSectionProps) => (
  <ImageSourceField
    error={error}
    fileInputAriaLabel="파일 업로드"
    inputId="publish-panel-thumbnail-url"
    isUploading={isUploading}
    label="썸네일"
    onFileChange={onFileChange}
    onValueChange={onThumbnailUrlChange}
    previewAlt="썸네일 미리보기"
    previewUrl={thumbnailPreviewUrl}
    value={thumbnailUrl}
  />
);

PublishThumbnailSectionBase.displayName = 'PublishThumbnailSection';

export const PublishThumbnailSection = React.memo(PublishThumbnailSectionBase);

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
      <p aria-live="polite" className={helperTextClass} role="status">
        이미 공개된 콘텐츠는 예약 발행으로 다시 전환할 수 없습니다.
      </p>
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

export const PublishScheduleSection = React.memo(PublishScheduleSectionBase);

const PublishProjectLinksSectionBase = ({
  githubUrl,
  githubUrlError,
  onGithubUrlChange,
  onWebsiteUrlChange,
  websiteUrl,
  websiteUrlError,
}: PublishProjectLinksSectionProps) => (
  <section className={sectionClass}>
    <p className={fieldLabelClass}>외부 링크</p>
    <div className={linkFieldGridClass}>
      <label className={linkFieldClass}>
        <span className={scheduleLabelClass}>웹사이트</span>
        <Input
          className={scheduleInputClass}
          onChange={event => onWebsiteUrlChange(event.target.value)}
          placeholder="https://example.com"
          type="url"
          value={websiteUrl}
        />
        {websiteUrlError ? (
          <p className={errorTextClass} role="alert">
            {websiteUrlError}
          </p>
        ) : null}
      </label>
      <label className={linkFieldClass}>
        <span className={scheduleLabelClass}>GitHub</span>
        <Input
          className={scheduleInputClass}
          onChange={event => onGithubUrlChange(event.target.value)}
          placeholder="https://github.com/owner/repository"
          type="url"
          value={githubUrl}
        />
        {githubUrlError ? (
          <p className={errorTextClass} role="alert">
            {githubUrlError}
          </p>
        ) : null}
      </label>
    </div>
  </section>
);

PublishProjectLinksSectionBase.displayName = 'PublishProjectLinksSection';

export const PublishProjectLinksSection = React.memo(PublishProjectLinksSectionBase);

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

const scheduleFieldGridClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',
});

const linkFieldGridClass = css({
  display: 'grid',
  gap: '3',
});

const linkFieldClass = css({
  display: 'grid',
  gap: '2',
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
