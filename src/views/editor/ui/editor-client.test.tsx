import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { EditorClient } from '@/views/editor/ui/editor-client';
import type { EditorCoreProps, PublishPanelProps } from '@/widgets/editor';

import '@testing-library/jest-dom/vitest';

const editorClientMockState = vi.hoisted(() => ({
  editorCoreRenderCount: 0,
  editorState: {
    dirty: true,
    slug: 'draft-slug',
    tags: [],
    translations: {
      en: {
        content: '',
        description: '',
        title: '',
      },
      fr: {
        content: '',
        description: '',
        title: '',
      },
      ja: {
        content: '',
        description: '',
        title: '',
      },
      ko: {
        content: '초안 본문',
        description: '',
        title: '초안 제목',
      },
    },
  },
}));

vi.mock('@/widgets/editor', async () => {
  const actual = await vi.importActual('@/widgets/editor');

  return {
    ...actual,
    EditorCore: ({ hideAppFrameFooter, onDraftSave, onOpenPublishPanel }: EditorCoreProps) => {
      editorClientMockState.editorCoreRenderCount += 1;

      return (
        <div data-hide-app-frame-footer={hideAppFrameFooter ? 'true' : undefined}>
          <button
            onClick={() => onOpenPublishPanel(editorClientMockState.editorState)}
            type="button"
          >
            발행하기
          </button>
          <button
            onClick={() => {
              void onDraftSave?.(editorClientMockState.editorState);
            }}
            type="button"
          >
            임시저장
          </button>
        </div>
      );
    },
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
  beforeEach(() => {
    editorClientMockState.editorCoreRenderCount = 0;
  });

  it('발행하기 버튼 클릭 시 publish panel을 연다', async () => {
    render(
      <EditorClient
        availableTags={[]}
        contentType="article"
        initialTranslations={editorClientMockState.editorState.translations}
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
        initialTranslations={editorClientMockState.editorState.translations}
        onDraftSave={onDraftSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: '설정 변경' }));
    fireEvent.click(screen.getByRole('button', { name: '발행 설정 닫기' }));

    fireEvent.click(screen.getByRole('button', { name: '임시저장' }));

    await waitFor(() => {
      expect(onDraftSave).toHaveBeenCalledWith(
        editorClientMockState.editorState,
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

  it('publish panel 열기와 닫기로 editor core를 다시 그리지 않는다', async () => {
    render(
      <EditorClient
        availableTags={[]}
        contentType="article"
        initialTranslations={editorClientMockState.editorState.translations}
      />,
    );

    expect(editorClientMockState.editorCoreRenderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });

    expect(editorClientMockState.editorCoreRenderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '발행 설정 닫기' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '발행 설정' })).toBeNull();
    });

    expect(editorClientMockState.editorCoreRenderCount).toBe(1);
  });

  it('hideAppFrameFooter를 editor core까지 전달한다', () => {
    const { container } = render(
      <EditorClient
        availableTags={[]}
        contentType="article"
        hideAppFrameFooter
        initialTranslations={editorClientMockState.editorState.translations}
      />,
    );

    expect(container.querySelector('[data-hide-app-frame-footer="true"]')).toBeTruthy();
  });
});
