import type React from 'react';

import type { EditorContentType } from '@/entities/editor/model/editor-types';

/**
 * markdown toolbar가 textarea 편집에 필요한 최소 계약을 정의합니다.
 *
 * @property contentType 현재 편집 중인 콘텐츠 종류입니다. 이미지 업로드 시 저장 경로와 정책 분기에 사용합니다.
 * @property onChange toolbar 액션이 계산한 다음 textarea 값을 상위 상태에 반영하는 callback입니다.
 * @property textareaRef 현재 포커스된 textarea DOM 참조입니다. selection 범위 계산과 삽입 위치 복원에 사용합니다.
 */
export type MarkdownToolbarProps = {
  contentType: EditorContentType;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

export type LinkMode = 'card' | 'link' | 'preview';

export type ToolbarActionItem = {
  icon?: React.ReactNode;
  key: string;
  label: string;
  onClick: () => void;
  token?: string;
};

export type ToolbarSectionItem =
  | {
      action: ToolbarActionItem;
      key: string;
      type: 'action';
    }
  | {
      key: string;
      node: React.ReactNode;
      type: 'custom';
    };

export type ToolbarSection = {
  items: ToolbarSectionItem[];
  key: string;
};
