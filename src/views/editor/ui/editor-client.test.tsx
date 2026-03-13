import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { EditorClient } from '@/views/editor/ui/editor-client';
import type { PublishPanelProps } from '@/widgets/editor';
import { createEmptyTranslations } from '@/widgets/editor/model/editor-core.utils';

import '@testing-library/jest-dom/vitest';

vi.mock('@/widgets/editor', async () => {
  const actual = await vi.importActual('@/widgets/editor');

  return {
    ...actual,
    PublishPanel: ({ isOpen, onClose, onSettingsChange }: PublishPanelProps) =>
      isOpen ? (
        <div aria-label="발행 설정" role="dialog">
          <button
            onClick={() =>
              onSettingsChange?.({
                allowComments: true,
                publishAt: '2026-03-20T01:00:00.000Z',
                slug: 'draft-slug',
                thumbnailUrl: 'https://example.com/thumb.png',
                visibility: 'private',
              })
            }
            type="button"
          >
            설정 변경
          </button>
          <button aria-label="발행 설정 닫기" onClick={onClose} type="button">
            닫기
          </button>
        </div>
      ) : null,
  };
});

describe('EditorClient', () => {
  it('발행하기 버튼 클릭 시 publish panel을 연다', async () => {
    render(
      <EditorClient
        availableTags={[]}
        contentType="article"
        initialTranslations={createEmptyTranslations()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });
  });

  it('publish panel에서 바꾼 설정을 draft 저장 시 함께 전달한다', async () => {
    const onDraftSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EditorClient
        availableTags={[]}
        contentType="article"
        initialTranslations={createEmptyTranslations()}
        onDraftSave={onDraftSave}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '제목' }), {
      target: { value: '초안 제목' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '본문 입력' }), {
      target: { value: '초안 본문' },
    });

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: '설정 변경' }));
    fireEvent.click(screen.getByRole('button', { name: '발행 설정 닫기' }));

    fireEvent.click(screen.getByRole('button', { name: '임시저장' }));

    await waitFor(() => {
      expect(onDraftSave).toHaveBeenCalledWith(
        expect.objectContaining({
          dirty: true,
        }),
        {
          allowComments: true,
          publishAt: '2026-03-20T01:00:00.000Z',
          slug: 'draft-slug',
          thumbnailUrl: 'https://example.com/thumb.png',
          visibility: 'private',
        },
        null,
      );
    });
  });
});
