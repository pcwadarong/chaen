import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { createDefaultResumeEditorContentMap } from '@/entities/resume/model/resume-editor.utils';
import { ResumeEditorCore } from '@/widgets/resume-editor/ui/resume-editor-core';

import '@testing-library/jest-dom/vitest';

describe('ResumeEditorCore', () => {
  const renderResumeEditorCore = (options?: {
    onDraftSave?: React.ComponentProps<typeof ResumeEditorCore>['onDraftSave'];
    onOpenPublishPanel?: React.ComponentProps<typeof ResumeEditorCore>['onOpenPublishPanel'];
  }) => {
    const initialContents = createDefaultResumeEditorContentMap();

    render(
      <ResumeEditorCore
        initialContents={initialContents}
        onDraftSave={options?.onDraftSave}
        onOpenPublishPanel={options?.onOpenPublishPanel ?? vi.fn()}
      />,
    );

    return {
      initialContents,
    };
  };

  it('임시저장 클릭 시 현재 resume 상태를 저장 callback으로 전달한다', async () => {
    const onDraftSave = vi.fn().mockResolvedValue({
      savedAt: '2026-03-13T08:30:00.000Z',
    });

    renderResumeEditorCore({ onDraftSave });

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

  it('locale 전환 시 각 언어 입력값을 따로 유지한다', async () => {
    renderResumeEditorCore();

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '한국어 제목' },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'EN' }));
    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: 'English title' },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'KO' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('한국어 제목');
    });

    fireEvent.click(screen.getByRole('tab', { name: 'EN' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('English title');
    });
  });

  it('저장 실패 시 fallback 사용자 메시지 토스트를 노출한다', async () => {
    const onDraftSave = vi.fn().mockRejectedValue(new Error('save failed'));

    renderResumeEditorCore({ onDraftSave });

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '실패 제목' },
    });
    fireEvent.click(screen.getByRole('button', { name: '임시저장' }));

    expect(
      await screen.findByText('이력서 임시 저장에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeTruthy();
  });

  it('게시하기 버튼은 현재 resume 상태를 전달한다', () => {
    const onOpenPublishPanel = vi.fn();

    renderResumeEditorCore({ onOpenPublishPanel });

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '게시 제목' },
    });
    fireEvent.click(screen.getByRole('button', { name: '게시하기' }));

    expect(onOpenPublishPanel).toHaveBeenCalledWith({
      contents: expect.objectContaining({
        ko: expect.objectContaining({
          title: '게시 제목',
        }),
      }),
      dirty: true,
    });
  });
});
