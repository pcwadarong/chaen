'use client';

import React, { useState } from 'react';
import { css, cva } from 'styled-system/css';

import type { ResumeEditorContentMap } from '@/entities/resume/api/resume-editor-read';
import { Input } from '@/shared/ui/input/input';
import { Textarea } from '@/shared/ui/textarea/textarea';
import type { Locale } from '@/widgets/editor/model/editor-core.types';

const RESUME_LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  ja: 'JA',
  ko: 'KO',
};

type ResumeEditorClientProps = {
  initialContents: ResumeEditorContentMap;
};

/**
 * resume 전용 관리 화면에서 locale별 텍스트 필드를 편집합니다.
 */
export const ResumeEditorClient = ({ initialContents }: ResumeEditorClientProps) => {
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [contents, setContents] = useState(initialContents);
  const activeContent = contents[activeLocale];

  /**
   * 현재 locale 필드 값을 부분 갱신합니다.
   */
  const updateActiveContent = (
    key: 'body' | 'description' | 'download_button_label' | 'download_unavailable_label' | 'title',
    value: string,
  ) => {
    setContents(previous => ({
      ...previous,
      [activeLocale]: {
        ...previous[activeLocale],
        [key]: value,
      },
    }));
  };

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <header className={headerClass}>
          <h1 className={titleClass}>이력서 편집</h1>
          <p className={descriptionClass}>resume 전용 구조로 locale별 소개 문구를 관리합니다.</p>
        </header>

        <div aria-label="이력서 언어 선택" className={tabListClass} role="tablist">
          {(Object.keys(RESUME_LOCALE_LABELS) as Locale[]).map(locale => (
            <button
              aria-selected={locale === activeLocale}
              className={tabRecipe({ active: locale === activeLocale })}
              key={locale}
              onClick={() => setActiveLocale(locale)}
              role="tab"
              type="button"
            >
              {RESUME_LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>

        <section className={formGridClass}>
          <label className={fieldClass}>
            <span className={labelClass}>제목</span>
            <Input
              onChange={event => updateActiveContent('title', event.target.value)}
              value={activeContent.title}
            />
          </label>
          <label className={fieldClass}>
            <span className={labelClass}>설명</span>
            <Input
              onChange={event => updateActiveContent('description', event.target.value)}
              value={activeContent.description}
            />
          </label>
          <label className={fieldClass}>
            <span className={labelClass}>다운로드 버튼 라벨</span>
            <Input
              onChange={event => updateActiveContent('download_button_label', event.target.value)}
              value={activeContent.download_button_label}
            />
          </label>
          <label className={fieldClass}>
            <span className={labelClass}>미준비 버튼 라벨</span>
            <Input
              onChange={event =>
                updateActiveContent('download_unavailable_label', event.target.value)
              }
              value={activeContent.download_unavailable_label}
            />
          </label>
          <label className={bodyFieldClass}>
            <span className={labelClass}>본문</span>
            <Textarea
              autoResize={false}
              onChange={event => updateActiveContent('body', event.target.value)}
              rows={18}
              value={activeContent.body}
            />
          </label>
        </section>
      </section>
    </main>
  );
};

const pageClass = css({
  width: 'full',
  px: '4',
  py: '8',
});

const panelClass = css({
  width: 'full',
  maxWidth: '[72rem]',
  mx: 'auto',
  display: 'grid',
  gap: '6',
});

const headerClass = css({
  display: 'grid',
  gap: '2',
});

const titleClass = css({
  m: '0',
  fontSize: '3xl',
  lineHeight: 'tight',
});

const descriptionClass = css({
  m: '0',
  color: 'muted',
});

const tabListClass = css({
  display: 'flex',
  gap: '2',
  borderBottom: '[1px solid var(--colors-border)]',
});

const tabRecipe = cva({
  base: {
    appearance: 'none',
    border: 'none',
    borderBottom: '[2px solid transparent]',
    bg: 'transparent',
    px: '3',
    py: '2',
    color: 'muted',
    fontWeight: 'semibold',
    cursor: 'pointer',
  },
  variants: {
    active: {
      false: {},
      true: {
        borderBottomColor: 'primary',
        color: 'primary',
      },
    },
  },
});

const formGridClass = css({
  display: 'grid',
  gap: '4',
});

const fieldClass = css({
  display: 'grid',
  gap: '2',
});

const bodyFieldClass = css({
  display: 'grid',
  gap: '2',
});

const labelClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
});
