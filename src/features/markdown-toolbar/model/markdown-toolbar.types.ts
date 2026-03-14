import type React from 'react';

export type MarkdownToolbarProps = {
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
