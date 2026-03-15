import type React from 'react';

import type { EditorContentType } from '@/entities/editor/model/editor-types';

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
