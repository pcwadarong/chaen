'use client';

import React from 'react';
import { css } from 'styled-system/css';

import type { EditorDraftSummary } from '@/entities/editor/api/editor.types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import {
  buildDraftContinueHref,
  formatDraftUpdatedAt,
} from '@/views/editor-drafts/model/editor-drafts.utils';

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

export const DraftTableRow = React.memo(DraftTableRowBase);

const rowActionsClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '2',
});
