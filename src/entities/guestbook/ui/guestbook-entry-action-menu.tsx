'use client';

import React from 'react';

import { ActionMenuButton, ActionPopover } from '@/shared/ui/action-popover/action-popover';
import {
  ArrowCurveLeftRightIcon,
  EditIcon,
  ReportIcon,
  TrashIcon,
} from '@/shared/ui/icons/app-icons';

type GuestbookEntryActionMenuProps = {
  actionDeleteLabel: string;
  actionEditLabel: string;
  actionMenuLabel: string;
  actionMenuPanelLabel: string;
  actionReplyLabel?: string;
  isOpen: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onOpenChange: (nextOpen: boolean) => void;
  onReply?: () => void;
  reportLabel: string;
};

/**
 * 방명록 엔트리 버블에서 사용하는 액션 메뉴를 렌더링합니다.
 */
export const GuestbookEntryActionMenu = ({
  actionDeleteLabel,
  actionEditLabel,
  actionMenuLabel,
  actionMenuPanelLabel,
  actionReplyLabel,
  isOpen,
  onDelete,
  onEdit,
  onOpenChange,
  onReply,
  reportLabel,
}: GuestbookEntryActionMenuProps) => (
  <ActionPopover
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    panelLabel={actionMenuPanelLabel}
    triggerLabel={actionMenuLabel}
  >
    {({ closePopover }) => (
      <>
        {onReply && actionReplyLabel ? (
          <ActionMenuButton
            icon={<ArrowCurveLeftRightIcon aria-hidden size="sm" />}
            label={actionReplyLabel}
            onClick={() => {
              closePopover();
              onReply();
            }}
          />
        ) : null}
        {onEdit ? (
          <ActionMenuButton
            icon={<EditIcon aria-hidden size="sm" />}
            label={actionEditLabel}
            onClick={() => {
              closePopover();
              onEdit();
            }}
          />
        ) : null}
        {onDelete ? (
          <ActionMenuButton
            icon={<TrashIcon aria-hidden size="sm" />}
            label={actionDeleteLabel}
            onClick={() => {
              closePopover();
              onDelete();
            }}
          />
        ) : null}
        <ActionMenuButton
          ariaDisabled
          icon={<ReportIcon aria-hidden size="sm" />}
          label={reportLabel}
        />
      </>
    )}
  </ActionPopover>
);
