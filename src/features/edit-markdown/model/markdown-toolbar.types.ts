import type React from 'react';

import type { EditorContentType } from '@/entities/editor/model/editor-types';
import type {
  MarkdownToolbarPresetItemKey,
  MarkdownToolbarSectionKey,
} from '@/entities/editor-core/model/toolbar-preset';
import type { ColorStylePopoverLabels } from '@/features/edit-markdown/ui/color-style-popover';
import type { LinkEmbedPopoverLabels } from '@/features/edit-markdown/ui/link-embed-popover';
import type {
  ToolbarTokenPopoverLabels,
  ToolbarTokenPopoverProps,
} from '@/features/edit-markdown/ui/toolbar-token-popover';
import type { ClosePopover } from '@/shared/ui/popover/popover';

/**
 * markdown toolbar가 textarea 편집에 필요한 최소 계약을 정의합니다.
 *
 * @property contentType 현재 편집 중인 콘텐츠 종류입니다. 이미지 업로드 시 저장 경로와 정책 분기에 사용합니다.
 * @property onChange toolbar 액션이 계산한 다음 textarea 값을 상위 상태에 반영하는 callback입니다.
 * @property textareaRef 현재 포커스된 textarea DOM 참조입니다. selection 범위 계산과 삽입 위치 복원에 사용합니다.
 * @property uiRegistry toolbar 내부 popover labels와 primitive 교체 지점을 host app이 주입할 수 있는 선택적 UI registry입니다.
 */
export type MarkdownToolbarProps = {
  contentType: EditorContentType;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  uiRegistry?: MarkdownToolbarUiRegistry;
};

/**
 * toolbar 내부 popover가 노출하는 기본 라벨을 host app이 부분적으로 덮어쓸 수 있는 묶음입니다.
 */
export type MarkdownToolbarUiLabels = {
  backgroundColorPopover?: Partial<ColorStylePopoverLabels>;
  headingPopover?: Partial<ToolbarTokenPopoverLabels>;
  linkEmbedPopover?: Partial<LinkEmbedPopoverLabels>;
  textColorPopover?: Partial<ColorStylePopoverLabels>;
  togglePopover?: Partial<ToolbarTokenPopoverLabels>;
};

/**
 * toolbar가 기본으로 제공하는 popover primitive를 host app이 교체할 수 있는 렌더 registry입니다.
 */
export type MarkdownToolbarPopoverRegistry = {
  backgroundColorPopover?: (props: TextColorPopoverRenderProps) => React.ReactNode;
  headingPopover?: (props: ToolbarTokenPopoverProps) => React.ReactNode;
  linkEmbedPopover?: (props: LinkEmbedPopoverRenderProps) => React.ReactNode;
  textColorPopover?: (props: TextColorPopoverRenderProps) => React.ReactNode;
  togglePopover?: (props: ToolbarTokenPopoverProps) => React.ReactNode;
};

/**
 * toolbar UI 커스터마이징 진입점입니다.
 * 라벨 덮어쓰기와 primitive 교체를 한 경로로 묶어 외부 package extraction 이후에도 동일한 surface를 유지합니다.
 */
export type MarkdownToolbarUiRegistry = {
  labels?: MarkdownToolbarUiLabels;
  popovers?: MarkdownToolbarPopoverRegistry;
};

export type LinkEmbedPopoverRenderProps = {
  labels?: Partial<LinkEmbedPopoverLabels>;
  onApply: (url: string, mode: LinkMode, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

export type TextColorPopoverRenderProps = {
  labels?: Partial<ColorStylePopoverLabels>;
  onApply: (colorHex: string, closePopover?: ClosePopover) => void;
  onTriggerMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  triggerClassName?: string;
};

export type LinkMode = 'card' | 'link' | 'preview';

export type ToolbarActionItem = {
  icon?: React.ReactNode;
  key: string;
  label: string;
  onClick: () => void;
  token?: string;
};

export type ToolbarTokenOption = {
  key: string;
  label: string;
  onClick: () => void;
  token: string;
};

export type ToolbarCustomItem = {
  key: MarkdownToolbarPresetItemKey;
  node: React.ReactNode;
  type: 'custom';
};

export type ToolbarSectionItem =
  | {
      action: ToolbarActionItem;
      key: string;
      type: 'action';
    }
  | ToolbarCustomItem;

export type ToolbarSection = {
  items: ToolbarSectionItem[];
  key: MarkdownToolbarSectionKey;
};

export type { MarkdownToolbarPresetItemKey };
