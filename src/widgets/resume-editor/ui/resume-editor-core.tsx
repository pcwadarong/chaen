'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css, cva } from 'styled-system/css';

import { isResumeEditorContentMapEqual } from '@/entities/resume/model/resume-editor.utils';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { EDITOR_LOCALES, type Locale } from '@/widgets/editor/model/editor-core.types';
import { formatSavedAtLabel } from '@/widgets/editor/model/editor-core.utils';

import type { ResumeEditorCoreProps } from '../model/resume-editor.types';

const AUTOSAVE_DEBOUNCE_MS = 180 * 1000;

const RESUME_LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  ja: 'JA',
  ko: 'KO',
};

type ResumeEditorFieldKey =
  | 'body'
  | 'description'
  | 'download_button_label'
  | 'download_unavailable_label'
  | 'title';

type SaveStatus = 'dirty' | 'idle' | 'saving';

/**
 * resume 전용 편집 셸에서 locale별 소개 텍스트와 저장 상태를 관리합니다.
 */
export const ResumeEditorCore = ({
  initialContents,
  initialSavedAt = null,
  onDraftSave,
  onOpenPublishPanel,
}: ResumeEditorCoreProps) => {
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [contents, setContents] = useState(initialContents);
  const [savedSnapshot, setSavedSnapshot] = useState(initialContents);
  const [savedAt, setSavedAt] = useState<string | null>(initialSavedAt);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const autosaveTimerRef = useRef<number | null>(null);
  const dirty = useMemo(
    () => !isResumeEditorContentMapEqual(contents, savedSnapshot),
    [contents, savedSnapshot],
  );
  const activeContent = contents[activeLocale];
  const savedAtLabel = formatSavedAtLabel(savedAt);
  /**
   * 현재 locale 필드 값을 부분 갱신합니다.
   */
  const updateActiveContent = (key: ResumeEditorFieldKey, value: string) => {
    setContents(previous => ({
      ...previous,
      [activeLocale]: {
        ...previous[activeLocale],
        [key]: value,
      },
    }));
  };

  /**
   * 저장 실패 토스트를 추가합니다.
   */
  const pushToast = (message: string) => {
    setToastItems(previous => [
      ...previous,
      {
        id: `resume-editor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        tone: 'error',
      },
    ]);
  };

  /**
   * draft 저장 callback을 실행하고 저장 시각 snapshot을 갱신합니다.
   */
  const runDraftSave = useCallback(async () => {
    if (!onDraftSave) {
      return;
    }

    if (!dirty) {
      return;
    }

    setSaveStatus('saving');

    try {
      const result = await onDraftSave({
        contents,
        dirty,
      });

      setSavedSnapshot(contents);
      setSavedAt(result?.savedAt ?? new Date().toISOString());
      setSaveStatus('idle');
    } catch (error) {
      setSaveStatus('dirty');
      pushToast(
        error instanceof Error
          ? error.message
          : '이력서 임시 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }, [contents, dirty, onDraftSave]);

  useEffect(() => {
    setSaveStatus(dirty ? 'dirty' : 'idle');
  }, [dirty]);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dirty]);

  useEffect(() => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (!onDraftSave || !dirty) {
      return;
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void runDraftSave();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [dirty, onDraftSave, runDraftSave]);

  useEffect(
    () => () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    },
    [],
  );

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <header className={headerClass}>
          <div className={headerCopyClass}>
            <h1 className={titleClass}>이력서 편집</h1>
            <p className={descriptionClass}>
              locale별 이력서 소개 문구와 다운로드 라벨을 관리합니다.
            </p>
          </div>
          <div className={actionRowClass}>
            <p aria-live="polite" className={saveStatusClass}>
              {saveStatus === 'saving'
                ? '저장 중...'
                : dirty
                  ? '변경사항 있음'
                  : savedAtLabel
                    ? `저장됨 ${savedAtLabel}`
                    : ''}
            </p>
            {onDraftSave ? (
              <Button
                disabled={saveStatus === 'saving'}
                onClick={() => void runDraftSave()}
                size="sm"
              >
                임시저장
              </Button>
            ) : null}
            <Button
              onClick={() =>
                onOpenPublishPanel({
                  contents,
                  dirty,
                })
              }
              size="sm"
              tone="primary"
            >
              게시하기
            </Button>
          </div>
        </header>

        <div aria-label="이력서 언어 선택" className={tabListClass} role="tablist">
          {EDITOR_LOCALES.map(locale => (
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
              aria-label="제목"
              onChange={event => updateActiveContent('title', event.target.value)}
              value={activeContent.title}
            />
          </label>
          <label className={fieldClass}>
            <span className={labelClass}>설명</span>
            <Input
              aria-label="설명"
              onChange={event => updateActiveContent('description', event.target.value)}
              value={activeContent.description}
            />
          </label>
          <label className={fieldClass}>
            <span className={labelClass}>다운로드 버튼 라벨</span>
            <Input
              aria-label="다운로드 버튼 라벨"
              onChange={event => updateActiveContent('download_button_label', event.target.value)}
              value={activeContent.download_button_label}
            />
          </label>
          <label className={fieldClass}>
            <span className={labelClass}>미준비 버튼 라벨</span>
            <Input
              aria-label="미준비 버튼 라벨"
              onChange={event =>
                updateActiveContent('download_unavailable_label', event.target.value)
              }
              value={activeContent.download_unavailable_label}
            />
          </label>
          <label className={bodyFieldClass}>
            <span className={labelClass}>본문</span>
            <Textarea
              aria-label="본문"
              autoResize={false}
              onChange={event => updateActiveContent('body', event.target.value)}
              rows={18}
              value={activeContent.body}
            />
          </label>
        </section>
      </section>

      <ToastViewport
        items={toastItems}
        onClose={id => setToastItems(previous => previous.filter(item => item.id !== id))}
      />
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
  gap: '4',
  '@media (min-width: 760px)': {
    gridTemplateColumns: '[minmax(0,1fr)_auto]',
    alignItems: 'end',
  },
});

const headerCopyClass = css({
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

const actionRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '3',
});

const saveStatusClass = css({
  minWidth: '[7rem]',
  m: '0',
  textAlign: 'right',
  fontSize: 'sm',
  color: 'muted',
});

const tabListClass = css({
  display: 'flex',
  gap: '4',
  borderBottom: '[1px solid var(--colors-border)]',
});

const tabRecipe = cva({
  base: {
    appearance: 'none',
    border: 'none',
    borderBottom: '[2px solid transparent]',
    bg: 'transparent',
    px: '2',
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
  '@media (min-width: 760px)': {
    gridTemplateColumns: '[repeat(2,minmax(0,1fr))]',
  },
});

const fieldClass = css({
  display: 'grid',
  gap: '2',
});

const bodyFieldClass = css({
  display: 'grid',
  gap: '2',
  '@media (min-width: 760px)': {
    gridColumn: '[1 / -1]',
  },
});

const labelClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
});
