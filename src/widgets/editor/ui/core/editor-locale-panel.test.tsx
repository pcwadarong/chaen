import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { EditorLocalePanel } from '@/widgets/editor/ui/core/editor-locale-panel';

vi.mock('@/features/edit-markdown/ui/markdown-toolbar', () => ({
  MarkdownToolbar: () => <div data-testid="markdown-toolbar" />,
}));

vi.mock('@/shared/lib/markdown/rich-markdown', () => ({
  renderRichMarkdown: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}));

const baseProps = {
  activeLocaleHasTitleError: false,
  contentType: 'article' as const,
  isActive: true,
  isMobileLayout: false,
  locale: 'ko' as const,
  markdownOptions: {} as never,
  mobileEditorPane: 'edit' as const,
  onContentChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onTextareaKeyDown: vi.fn(),
  onTextareaPaste: vi.fn(),
  onTextareaScroll: vi.fn(),
  onTitleChange: vi.fn(),
  textareaRef: { current: null },
  translation: {
    content: '',
    description: '',
    title: '',
  },
};

describe('EditorLocalePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제목 에러가 있으면 textarea와 에러 메시지를 연결한다', () => {
    render(<EditorLocalePanel {...baseProps} activeLocaleHasTitleError />);
    const titleField = screen.getByLabelText('제목');

    expect(screen.getByRole('alert').textContent).toBe('제목을 입력해주세요');
    expect(titleField.getAttribute('aria-invalid')).toBe('true');
    expect(titleField.getAttribute('aria-describedby')).toBe('editor-title-error-ko');
  });

  it('본문 입력 변경을 locale과 함께 전달한다', () => {
    render(<EditorLocalePanel {...baseProps} />);

    fireEvent.change(screen.getByLabelText('본문 입력'), {
      target: { value: '새 본문' },
    });

    expect(baseProps.onContentChange).toHaveBeenCalledWith('ko', '새 본문');
  });
});
