import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';

import { uploadEditorImage } from '@/entities/editor/api/upload-editor-image';
import { ImageEmbedPopover } from '@/features/edit-markdown/ui/image-embed-popover';

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt,
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    unoptimized?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={alt} />
  ),
}));

vi.mock('@/shared/ui/modal/modal', () => ({
  Modal: ({
    ariaLabel,
    children,
    isOpen,
  }: {
    ariaLabel?: string;
    children: React.ReactNode;
    isOpen: boolean;
  }) =>
    isOpen ? (
      <div aria-label={ariaLabel} role="dialog">
        {children}
      </div>
    ) : null,
}));

vi.mock('@/entities/editor/api/upload-editor-image', () => ({
  uploadEditorImage: vi.fn(),
}));

const renderImageModal = (onApply = vi.fn()) => {
  render(<ImageEmbedPopover contentType="article" onApply={onApply} />);
  fireEvent.click(screen.getByRole('button', { name: '이미지' }));

  return {
    dialog: screen.getByRole('dialog', { name: '이미지 삽입' }),
    onApply,
  };
};

const addUrls = (dialog: HTMLElement, urls: string[]) => {
  const urlToggle = within(dialog).queryByRole('button', { name: 'URL 추가' });
  if (urlToggle) {
    fireEvent.click(urlToggle);
  }
  fireEvent.change(within(dialog).getByLabelText('웹 URL 추가'), {
    target: { value: urls.join('\n') },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: '추가' }));
};

describe('ImageEmbedPopover', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('트리거 hover/focus 상태에서, ImageEmbedPopover는 모달을 열 때 tooltip을 즉시 닫아야 한다', async () => {
    render(<ImageEmbedPopover contentType="article" onApply={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: '이미지' });
    fireEvent.mouseEnter(trigger);
    expect(await screen.findByRole('tooltip')).toBeTruthy();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  it('초기 상태에서, ImageEmbedPopover는 드롭존과 기본 URL 입력만 렌더링해야 한다', () => {
    const { dialog } = renderImageModal();

    expect(within(dialog).getByText('이미지를 여기로 끌어다 놓으세요.')).toBeTruthy();
    expect(within(dialog).getByLabelText('드롭존 이미지 업로드')).toBeTruthy();
    expect(within(dialog).getByLabelText('웹 URL 추가')).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'URL 추가' })).toBeNull();
    expect(within(dialog).queryByRole('button', { name: '개별 이미지로 삽입' })).toBeNull();
  });

  it('초기 드롭존에 파일을 놓으면, ImageEmbedPopover는 편집 상태 레이아웃과 상단 액션을 렌더링해야 한다', async () => {
    const { dialog } = renderImageModal();
    vi.mocked(uploadEditorImage).mockResolvedValue('https://cdn.example.com/dropped.png');

    const dropzone = dialog.querySelector('[data-image-empty-dropzone]');
    expect(dropzone).toBeTruthy();

    fireEvent.drop(dropzone as HTMLElement, {
      dataTransfer: {
        files: [new File([''], 'dropped.png', { type: 'image/png' })],
      },
    });

    await waitFor(() => {
      expect(within(dialog).getAllByText('이미지 목록').length).toBeGreaterThan(0);
    });

    expect(within(dialog).getByLabelText('이미지 파일 업로드')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'URL 추가' })).toBeTruthy();
    expect(within(dialog).getByLabelText('URL')).toBeTruthy();
    expect(within(dialog).getByLabelText('선택 이미지 업로드')).toBeTruthy();
  });

  it('여러 줄 URL을 추가하면, ImageEmbedPopover는 편집 상태 row를 생성해야 한다', () => {
    const { dialog } = renderImageModal();

    addUrls(dialog, ['https://example.com/one.png', 'https://example.com/two.png']);

    expect(within(dialog).getAllByText('이미지 목록').length).toBeGreaterThan(0);
    expect(within(dialog).getAllByRole('button', { name: /https:\/\/example\.com/ })).toHaveLength(
      2,
    );
  });

  it('개별 이미지 삽입을 실행하면, ImageEmbedPopover는 편집된 이미지 목록 payload를 전달해야 한다', () => {
    const { dialog, onApply } = renderImageModal();

    addUrls(dialog, ['https://example.com/one.png', 'https://example.com/two.png']);
    fireEvent.change(within(dialog).getByLabelText('URL'), {
      target: { value: 'https://example.com/one.png' },
    });
    fireEvent.change(within(dialog).getByLabelText('대체 텍스트'), {
      target: { value: '첫 번째 설명' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /two\.png/ }));
    fireEvent.change(within(dialog).getByLabelText('URL'), {
      target: { value: 'https://example.com/two.png' },
    });
    fireEvent.change(within(dialog).getByLabelText('대체 텍스트'), {
      target: { value: '두 번째 설명' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: '개별 이미지로 삽입' }));

    expect(onApply).toHaveBeenCalledWith({
      items: [
        { altText: '첫 번째 설명', url: 'https://example.com/one.png' },
        { altText: '두 번째 설명', url: 'https://example.com/two.png' },
      ],
      mode: 'individual',
    });
  });

  it('유효 이미지가 1개뿐이면, ImageEmbedPopover는 슬라이드 삽입 버튼을 비활성화해야 한다', () => {
    const { dialog } = renderImageModal();

    addUrls(dialog, ['https://example.com/one.png']);
    fireEvent.change(within(dialog).getByLabelText('URL'), {
      target: { value: 'https://example.com/one.png' },
    });

    expect(
      (within(dialog).getByRole('button', { name: '슬라이드로 삽입' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('업로드와 URL 추가를 섞으면, ImageEmbedPopover는 하나의 삽입 흐름으로 합쳐야 한다', async () => {
    const { dialog, onApply } = renderImageModal();
    vi.mocked(uploadEditorImage).mockResolvedValue('https://cdn.example.com/uploaded.png');

    addUrls(dialog, ['https://example.com/first.png']);
    fireEvent.change(within(dialog).getByLabelText('URL'), {
      target: { value: 'https://example.com/first.png' },
    });

    const fileInput = within(dialog).getByLabelText('이미지 파일 업로드');
    fireEvent.change(fileInput, {
      target: {
        files: [new File([''], 'from-upload.png', { type: 'image/png' })],
      },
    });

    addUrls(dialog, ['https://example.com/second.png']);

    await waitFor(() => {
      expect(vi.mocked(uploadEditorImage)).toHaveBeenCalledWith({
        contentType: 'article',
        file: expect.any(File),
        imageKind: 'content',
      });
    });

    await screen.findByRole('button', { name: /from-upload\.png/ });

    fireEvent.click(within(dialog).getByRole('button', { name: '개별 이미지로 삽입' }));
    expect(onApply).toHaveBeenCalledWith({
      items: expect.arrayContaining([
        { altText: '이미지 설명', url: 'https://example.com/first.png' },
        { altText: 'from-upload.png', url: 'https://cdn.example.com/uploaded.png' },
        { altText: '이미지 설명', url: 'https://example.com/second.png' },
      ]),
      mode: 'individual',
    });
  });
});
