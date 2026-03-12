'use client';

import React, { useMemo, useState } from 'react';
import { MarkdownHooks } from 'react-markdown';
import { css } from 'styled-system/css';

import { getMarkdownOptions, markdownBodyClass } from '@/shared/lib/markdown/markdown-config';
import { renderRichMarkdown } from '@/shared/lib/markdown/rich-markdown';
import { SlugInput } from '@/shared/ui/editor/slug-input';
import { TagSelector } from '@/shared/ui/editor/tag-selector';

import { AdminMarkdownEditor } from './admin-markdown-editor';

type AdminEditorShellProps = {
  availableTags: {
    id: string;
    label: string;
    slug: string;
  }[];
};

/**
 * 관리자 에디터의 좌우 1:1 입력/미리보기 셸입니다.
 * 아직 저장 연동은 하지 않고, slug/tag/본문 preview 흐름만 검증합니다.
 */
export const AdminEditorShell = ({ availableTags }: AdminEditorShellProps) => {
  const [slug, setSlug] = useState('');
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState('');
  const markdownOptions = useMemo(() => getMarkdownOptions(), []);

  /**
   * 관리자 전용 slug 중복 확인 API를 호출합니다.
   */
  const handleSlugDuplicateCheck = async (nextSlug: string) => {
    const response = await fetch(`/api/admin/slug-check?slug=${encodeURIComponent(nextSlug)}`);

    if (!response.ok) {
      throw new Error(`Slug check failed: ${response.status}`);
    }

    const body = (await response.json()) as { duplicate: boolean };

    return body.duplicate;
  };

  return (
    <div className={pageClass}>
      <section aria-labelledby="admin-editor-title" className={panelClass}>
        <div className={headerClass}>
          <p className={eyebrowClass}>ADMIN EDITOR</p>
          <h1 className={titleClass} id="admin-editor-title">
            공용 에디터 초안
          </h1>
        </div>

        <div className={metaGridClass}>
          <SlugInput onChange={setSlug} onCheckDuplicate={handleSlugDuplicateCheck} value={slug} />
        </div>

        <TagSelector
          availableTags={availableTags}
          onChange={setSelectedTagSlugs}
          selectedTagSlugs={selectedTagSlugs}
        />

        <div className={editorGridClass}>
          <section aria-labelledby="admin-editor-write-title" className={editorPaneClass}>
            <div className={paneHeaderClass}>
              <h2 className={paneTitleClass} id="admin-editor-write-title">
                입력
              </h2>
            </div>
            <AdminMarkdownEditor onChange={setMarkdown} value={markdown} />
          </section>

          <section aria-labelledby="admin-editor-preview-title" className={editorPaneClass}>
            <h2 className={paneTitleClass} id="admin-editor-preview-title">
              미리보기
            </h2>
            <div className={previewClass}>
              {markdown.trim().length > 0 ? (
                <div className={markdownBodyClass}>
                  {renderRichMarkdown({
                    markdown,
                    renderMarkdownFragment: (fragmentMarkdown, key) => (
                      <MarkdownHooks key={key} {...markdownOptions}>
                        {fragmentMarkdown}
                      </MarkdownHooks>
                    ),
                  })}
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
    </div>
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
