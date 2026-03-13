import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { PublishPanel } from '@/widgets/editor/ui/publish-panel';

import '@testing-library/jest-dom/vitest';

const baseEditorState = {
  dirty: true,
  slug: 'editor-core',
  tags: [],
  translations: {
    en: { content: '', title: '' },
    fr: { content: '', title: '' },
    ja: { content: '', title: '' },
    ko: { content: '본문', title: '한국어 제목' },
  },
};

/**
 * 패널 테스트용 기본 렌더러입니다.
 */
const renderPublishPanel = (
  options?: Partial<React.ComponentProps<typeof PublishPanel>> & {
    editorState?: React.ComponentProps<typeof PublishPanel>['editorState'];
  },
) => {
  const onClose = options?.onClose ?? vi.fn();
  const onSubmit = options?.onSubmit ?? vi.fn().mockResolvedValue(undefined);

  render(
    <PublishPanel
      contentType={options?.contentType ?? 'article'}
      editorState={options?.editorState ?? { ...baseEditorState }}
      initialSettings={options?.initialSettings}
      isOpen={options?.isOpen ?? true}
      isPublished={options?.isPublished}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );

  return {
    onClose,
    onSubmit,
  };
};

describe('PublishPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('backdrop 클릭 시 패널을 닫는다', async () => {
    const { onClose } = renderPublishPanel();

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('dialog').parentElement as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('예약 발행 선택 시 UTC 변환 결과를 실시간으로 표시한다', async () => {
    renderPublishPanel();

    fireEvent.click(screen.getByLabelText('예약 발행'));
    fireEvent.change(screen.getByLabelText('날짜'), {
      target: { value: '2026-03-20' },
    });
    fireEvent.change(screen.getByLabelText('시간'), {
      target: { value: '10:00' },
    });

    expect(await screen.findByText('UTC: 2026-03-20T01:00:00.000Z')).toBeTruthy();
  });

  it('validation 오류가 있으면 인라인 에러를 표시하고 제출하지 않는다', async () => {
    const { onSubmit } = renderPublishPanel({
      editorState: {
        ...baseEditorState,
        translations: {
          ...baseEditorState.translations,
          ko: { content: '본문', title: '' },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '발행 설정' })).toBeTruthy();
    });

    fireEvent.change(screen.getByRole('textbox', { name: '슬러그' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByLabelText('예약 발행'));
    fireEvent.change(screen.getByLabelText('날짜'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.change(screen.getByLabelText('시간'), {
      target: { value: '10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    expect(await screen.findByText('한국어 제목을 입력해주세요')).toBeTruthy();
    expect(screen.getByText('슬러그를 입력해주세요')).toBeTruthy();
    expect(screen.getByText('발행 시간은 현재 시간 이후여야 합니다')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('파일 업로드 성공 시 thumbnailUrl과 미리보기를 갱신한다', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ url: 'https://example.com/uploaded-thumb.png' }),
      ok: true,
    } as Response);

    renderPublishPanel();

    const fileInput = screen.getByLabelText('파일 업로드') as HTMLInputElement;

    const file = new File(['binary'], 'thumb.png', { type: 'image/png' });
    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('썸네일')).toHaveValue('https://example.com/uploaded-thumb.png');
      expect(screen.getByAltText('썸네일 미리보기')).toHaveAttribute(
        'src',
        'https://example.com/uploaded-thumb.png',
      );
    });
  });

  it('제출 중에는 버튼을 비활성화하고 완료 후 닫는다', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSubmit = resolve;
        }),
    );
    const { onClose } = renderPublishPanel({ onSubmit });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '발행하기' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: '발행하기' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /발행 중/ })).toBeDisabled();
    });

    if (!resolveSubmit) {
      throw new Error('submit resolver not set');
    }

    resolveSubmit();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
