'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type { EditorDraftSummary } from '@/entities/editor/api/editor.types';
import { parseEditorError } from '@/entities/editor/model/editor-error';
import { AdminTable } from '@/shared/ui/admin-table';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';
import { DraftTableRow } from '@/views/editor-drafts/ui/editor-drafts-row';
import { AdminConsoleShell } from '@/widgets/admin-console';

type EditorDraftsPageProps = {
  items: EditorDraftSummary[];
  locale?: string;
  onDeleteDraft?: (
    draftId: string,
    contentType: EditorDraftSummary['contentType'],
  ) => Promise<void>;
};

/**
 * 관리자 임시저장 목록을 표 형태로 렌더링합니다.
 */
export const EditorDraftsPage = ({ items, locale, onDeleteDraft }: EditorDraftsPageProps) => {
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

  const content = (
    <>
      <section className={panelClass}>
        {draftItems.length > 0 ? (
          <AdminTable>
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
          </AdminTable>
        ) : (
          <div className={emptyStateClass}>저장된 draft가 없습니다.</div>
        )}
      </section>

      <ToastViewport items={toastItems} onClose={handleToastClose} />
    </>
  );

  if (!locale) {
    return <main className={pageClass}>{content}</main>;
  }

  return (
    <AdminConsoleShell activeSection="drafts" locale={locale} title="Drafts">
      <div className={pageClass}>{content}</div>
    </AdminConsoleShell>
  );
};

const pageClass = css({
  width: 'full',
  py: '0',
});

const panelClass = css({
  width: 'full',
  display: 'grid',
  gap: '3',
});

const emptyStateClass = css({
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border',
  borderRadius: '2xl',
  px: '5',
  py: '8',
  color: 'muted',
  textAlign: 'center',
});
