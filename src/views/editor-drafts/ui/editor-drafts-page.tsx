import React from 'react';
import { css } from 'styled-system/css';

import type { EditorDraftSummary } from '@/entities/editor/api/editor.types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';

type EditorDraftsPageProps = {
  items: EditorDraftSummary[];
};

/**
 * 관리자 임시저장 목록을 표 형태로 렌더링합니다.
 */
export const EditorDraftsPage = ({ items }: EditorDraftsPageProps) => (
  <main className={pageClass}>
    <section className={panelClass}>
      <div className={headerClass}>
        <h1 className={titleClass}>임시저장 목록</h1>
        <p className={descriptionClass}>최근 수정 순서로 이어쓰기 가능한 draft를 보여줍니다.</p>
      </div>

      {items.length > 0 ? (
        <div className={tableFrameClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th>타입</th>
                <th>제목 (KO)</th>
                <th>수정일</th>
                <th aria-label="동작" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.contentType}</td>
                  <td>{item.title}</td>
                  <td>{formatDraftUpdatedAt(item.updatedAt)}</td>
                  <td>
                    <Button asChild size="sm" tone="primary" variant="ghost">
                      <Link href={buildDraftContinueHref(item)}>이어쓰기</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={emptyStateClass}>저장된 draft가 없습니다.</div>
      )}
    </section>
  </main>
);

/**
 * draft 타입과 contentId 여부에 따라 이어쓰기 경로를 계산합니다.
 */
const buildDraftContinueHref = (item: EditorDraftSummary) => {
  if (item.contentType === 'article') {
    return item.contentId
      ? `/admin/articles/${item.contentId}/edit`
      : `/admin/articles/new?draftId=${item.id}`;
  }

  if (item.contentType === 'project') {
    return item.contentId
      ? `/admin/projects/${item.contentId}/edit`
      : `/admin/projects/new?draftId=${item.id}`;
  }

  return `/admin/resume/edit?draftId=${item.id}`;
};

/**
 * 목록 표시용 수정 시각을 YYYY-MM-DD HH:MM 형식으로 포맷합니다.
 */
const formatDraftUpdatedAt = (updatedAt: string) => {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return updatedAt;
  }

  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
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

const tableFrameClass = css({
  width: 'full',
  overflowX: 'auto',
  border: '[1px solid var(--colors-border)]',
  borderRadius: '2xl',
  bg: 'surface',
});

const tableClass = css({
  width: 'full',
  borderCollapse: 'collapse',
  '& th, & td': {
    px: '4',
    py: '4',
    borderBottom: '[1px solid var(--colors-border-subtle)]',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  '& th': {
    color: 'muted',
    fontWeight: 'semibold',
  },
  '& tbody tr:last-child td': {
    borderBottom: 'none',
  },
});

const emptyStateClass = css({
  border: '[1px solid var(--colors-border)]',
  borderRadius: '2xl',
  px: '5',
  py: '8',
  color: 'muted',
  textAlign: 'center',
});
