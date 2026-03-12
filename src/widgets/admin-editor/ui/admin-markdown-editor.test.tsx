import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { AdminMarkdownEditor } from '@/widgets/admin-editor/ui/admin-markdown-editor';

/**
 * 관리자 markdown editor를 상태와 함께 렌더해 textarea keydown 상호작용을 검증합니다.
 */
const AdminMarkdownEditorHarness = () => {
  const [value, setValue] = React.useState('');

  return <AdminMarkdownEditor onChange={setValue} value={value} />;
};

describe('AdminMarkdownEditor', () => {
  it('목록 항목에서 Enter를 누르면 같은 depth의 다음 목록 항목을 이어쓴다', async () => {
    render(<AdminMarkdownEditorHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '- 첫 번째' } });
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    fireEvent.keyDown(textarea, { key: 'Enter' });

    await waitFor(() => {
      expect(textarea.value).toBe('- 첫 번째\n- ');
      expect(textarea.selectionStart).toBe(9);
      expect(textarea.selectionEnd).toBe(9);
    });
  });

  it('목록 줄에서 Tab과 Shift+Tab으로 nested depth를 조절한다', async () => {
    render(<AdminMarkdownEditorHarness />);

    const textarea = screen.getByRole('textbox', { name: '본문 입력' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '- 첫 번째' } });
    textarea.setSelectionRange(0, textarea.value.length);

    fireEvent.keyDown(textarea, { key: 'Tab' });

    await waitFor(() => {
      expect(textarea.value).toBe('  - 첫 번째');
    });

    textarea.setSelectionRange(0, textarea.value.length);
    fireEvent.keyDown(textarea, { key: 'Tab', shiftKey: true });

    await waitFor(() => {
      expect(textarea.value).toBe('- 첫 번째');
    });
  });
});
