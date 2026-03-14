'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type { EditorDraftSummary } from '@/entities/editor/api/editor.types';
import { parseEditorError } from '@/entities/editor/model/editor-error';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';

type EditorDraftsPageProps = {
  items: EditorDraftSummary[];
  onDeleteDraft?: (
    draftId: string,
    contentType: EditorDraftSummary['contentType'],
  ) => Promise<void>;
};

type DraftTableRowProps = {
  isPending: boolean;
  item: EditorDraftSummary;
  onDeleteDraft?: (item: EditorDraftSummary) => Promise<void> | void;
};

/**
 * draft 목록 row를 렌더링합니다.
 * pending 여부가 바뀐 row만 다시 그릴 수 있도록 분리합니다.
 */
const DraftTableRowBase = ({ isPending, item, onDeleteDraft }: DraftTableRowProps) => {
  const continueHref = React.useMemo(() => buildDraftContinueHref(item), [item]);
  const updatedAtLabel = React.useMemo(
    () => formatDraftUpdatedAt(item.updatedAt),
    [item.updatedAt],
  );
  const handleDeleteClick = React.useCallback(() => {
    onDeleteDraft?.(item);
  }, [item, onDeleteDraft]);

  return (
    <tr>
      <td>{item.contentType}</td>
      <td>{item.title}</td>
      <td>{updatedAtLabel}</td>
      <td>
        <div className={rowActionsClass}>
          <Button asChild size="sm" tone="primary" variant="ghost">
            <Link href={continueHref}>이어쓰기</Link>
          </Button>
          {onDeleteDraft ? (
            <Button
              disabled={isPending}
              onClick={handleDeleteClick}
              size="sm"
              tone="black"
              variant="ghost"
            >
              {isPending ? '삭제 중...' : '삭제'}
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
};

DraftTableRowBase.displayName = 'DraftTableRow';

const DraftTableRow = React.memo(DraftTableRowBase);

/**
 * 관리자 임시저장 목록을 표 형태로 렌더링합니다.
 */
export const EditorDraftsPage = ({ items, onDeleteDraft }: EditorDraftsPageProps) => {
  const [draftItems, setDraftItems] = React.useState(items);
  const [pendingDraftId, setPendingDraftId] = React.useState<string | null>(null);
  const [toastItems, setToastItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    setDraftItems(items);
  }, [items]);

  /**
   * 삭제 성공/실패 토스트를 추가합니다.
   */
  const pushToast = React.useCallback((message: string, tone: ToastItem['tone']) => {
    setToastItems(previous => [
      ...previous,
      {
        id: `editor-drafts-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        tone,
      },
    ]);
  }, []);
  const handleToastClose = React.useCallback((id: string) => {
    setToastItems(previous => previous.filter(item => item.id !== id));
  }, []);

  /**
   * 사용자 확인 후 선택한 draft를 삭제하고, 성공하면 현재 목록에서도 제거합니다.
   */
  const handleDeleteDraft = React.useCallback(
    async (item: EditorDraftSummary) => {
      if (!onDeleteDraft) {
        return;
      }

      const confirmed = window.confirm(`"${item.title}" 임시저장을 삭제할까요?`);

      if (!confirmed) {
        return;
      }

      setPendingDraftId(item.id);

      try {
        await onDeleteDraft(item.id, item.contentType);
        setDraftItems(currentItems =>
          currentItems.filter(currentItem => currentItem.id !== item.id),
        );
        pushToast('임시저장을 삭제했습니다.', 'success');
      } catch (error) {
        const parsedError = parseEditorError(error, 'draftDeleteFailed');
        pushToast(parsedError.message, 'error');
      } finally {
        setPendingDraftId(currentDraftId => (currentDraftId === item.id ? null : currentDraftId));
      }
    },
    [onDeleteDraft, pushToast],
  );

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <div className={headerClass}>
          <h1 className={titleClass}>임시저장 목록</h1>
          <p className={descriptionClass}>최근 수정 순서로 이어쓰기 가능한 draft를 보여줍니다.</p>
        </div>
        {draftItems.length > 0 ? (
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
                {draftItems.map(item => (
                  <DraftTableRow
                    isPending={pendingDraftId === item.id}
                    item={item}
                    key={item.id}
                    onDeleteDraft={onDeleteDraft ? handleDeleteDraft : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={emptyStateClass}>저장된 draft가 없습니다.</div>
        )}
      </section>

      <ToastViewport items={toastItems} onClose={handleToastClose} />
    </main>
  );
};

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

const rowActionsClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  justifyContent: 'flex-end',
});

const emptyStateClass = css({
  border: '[1px solid var(--colors-border)]',
  borderRadius: '2xl',
  px: '5',
  py: '8',
  color: 'muted',
  textAlign: 'center',
});
