'use client';

import React, { useState } from 'react';
import { MarkdownHooks } from 'react-markdown';
import { css } from 'styled-system/css';

import { getMarkdownOptions, markdownBodyClass } from '@/shared/lib/markdown/markdown-config';
import { SlugInput } from '@/shared/ui/editor/slug-input';
import { TagSelector } from '@/shared/ui/editor/tag-selector';
import { Textarea } from '@/shared/ui/textarea/textarea';

type AdminEditorShellProps = {
  availableTags: {
    id: string;
    slug: string;
  }[];
};

/**
 * 관리자 에디터의 좌우 1:1 입력/미리보기 셸입니다.
 * 아직 저장 연동은 하지 않고, slug/tag/본문 preview 흐름만 검증합니다.
 */
export const AdminEditorShell = ({ availableTags }: AdminEditorShellProps) => {
  const [slug, setSlug] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState('');
  const markdownOptions = getMarkdownOptions();

  return (
    <main className={pageClass}>
      <section aria-labelledby="admin-editor-title" className={panelClass}>
        <div className={headerClass}>
          <p className={eyebrowClass}>ADMIN EDITOR</p>
          <h1 className={titleClass} id="admin-editor-title">
            공용 에디터 초안
          </h1>
        </div>

        <div className={metaGridClass}>
          <SlugInput onChange={setSlug} value={slug} />
        </div>

        <TagSelector
          availableTags={availableTags}
          onChange={setSelectedTagIds}
          selectedTagIds={selectedTagIds}
        />

        <div className={editorGridClass}>
          <section aria-labelledby="admin-editor-write-title" className={editorPaneClass}>
            <div className={paneHeaderClass}>
              <h2 className={paneTitleClass} id="admin-editor-write-title">
                입력
              </h2>
              <span className={paneMetaClass}>{markdown.length} chars</span>
            </div>
            <Textarea
              aria-label="본문 입력"
              autoResize={false}
              className={editorTextareaClass}
              onChange={event => setMarkdown(event.target.value)}
              placeholder="마크다운 본문을 입력하세요"
              rows={18}
              value={markdown}
            />
          </section>

          <section aria-labelledby="admin-editor-preview-title" className={editorPaneClass}>
            <div className={paneHeaderClass}>
              <h2 className={paneTitleClass} id="admin-editor-preview-title">
                미리보기
              </h2>
              <span className={paneMetaClass}>
                {selectedTagIds.length > 0 ? `${selectedTagIds.length}개 선택됨` : 'draft'}
              </span>
            </div>
            <div className={previewClass}>
              {markdown.trim().length > 0 ? (
                <div className={markdownBodyClass}>
                  <MarkdownHooks {...markdownOptions}>{markdown}</MarkdownHooks>
                </div>
              ) : (
                <p className={emptyPreviewClass}>
                  오른쪽 미리보기는 입력한 markdown을 바로 렌더링합니다.
                </p>
              )}
            </div>
          </section>
        </div>
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
  display: 'grid',
  gap: '6',
  mx: 'auto',
});

const headerClass = css({
  display: 'grid',
  gap: '1',
});

const eyebrowClass = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  letterSpacing: '[0.22em]',
  color: 'primary',
});

const titleClass = css({
  fontSize: '[clamp(2rem,4vw,3rem)]',
  lineHeight: 'tight',
  letterSpacing: '[-0.04em]',
});

const metaGridClass = css({
  display: 'grid',
  gap: '4',
  gridTemplateColumns: 'minmax(0, 1fr)',
});

const editorGridClass = css({
  display: 'grid',
  gap: '4',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media (max-width: 960px)': {
    gridTemplateColumns: '1fr',
  },
});

const editorPaneClass = css({
  display: 'grid',
  gap: '3',
  minHeight: '[32rem]',
  p: '4',
  borderRadius: 'xl',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  background: 'surface',
});

const paneHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const paneTitleClass = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
});

const paneMetaClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const editorTextareaClass = css({
  minHeight: '[28rem]',
  height: 'full',
  resize: 'none',
  fontFamily: 'mono',
});

const previewClass = css({
  minHeight: '[28rem]',
  p: '4',
  borderRadius: 'lg',
  background: 'surfaceMuted',
  overflowY: 'auto',
});

const emptyPreviewClass = css({
  fontSize: 'sm',
  color: 'muted',
});
