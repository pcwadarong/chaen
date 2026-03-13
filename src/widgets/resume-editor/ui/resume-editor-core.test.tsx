import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { createDefaultResumeEditorContentMap } from '@/entities/resume/model/resume-editor.utils';
import { ResumeEditorCore } from '@/widgets/resume-editor/ui/resume-editor-core';

import '@testing-library/jest-dom/vitest';

describe('ResumeEditorCore', () => {
  it('임시저장 클릭 시 현재 resume 상태를 저장 callback으로 전달한다', async () => {
    const onDraftSave = vi.fn().mockResolvedValue({
      savedAt: '2026-03-13T08:30:00.000Z',
    });
    const initialContents = createDefaultResumeEditorContentMap();

    render(
      <ResumeEditorCore
        initialContents={initialContents}
        onDraftSave={onDraftSave}
        onOpenPublishPanel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '새 한국어 제목' },
    });
    fireEvent.click(screen.getByRole('button', { name: '임시저장' }));

    await waitFor(() => {
      expect(onDraftSave).toHaveBeenCalledWith({
        contents: expect.objectContaining({
          ko: expect.objectContaining({
            title: '새 한국어 제목',
          }),
        }),
        dirty: true,
      });
    });

    expect(screen.getByText(/저장됨 \d{2}:\d{2}/)).toBeTruthy();
  });
});
