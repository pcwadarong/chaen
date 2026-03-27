import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';

import { AdminPhotoLibraryPanel } from '@/widgets/admin-photo-library/ui/admin-photo-library-panel';

vi.mock('@/shared/lib/image/optimize-admin-photo-file', () => ({
  optimizeAdminPhotoFile: vi.fn(async (file: File) => file),
}));

const baseItems = [
  {
    createdAt: '2026-03-27T09:00:00.000Z',
    fileName: 'first.jpg',
    filePath: 'first.jpg',
    mimeType: 'image/jpeg',
    publicUrl: 'https://example.com/first.jpg',
    size: 120_000,
  },
];

describe('AdminPhotoLibraryPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('초기 이미지 리스트와 삭제 버튼을 함께 렌더링한다', () => {
    vi.stubGlobal('fetch', vi.fn());

    render(<AdminPhotoLibraryPanel initialItems={baseItems} />);

    expect(screen.getByRole('heading', { level: 2, name: '사진 보관함' })).toBeTruthy();
    expect(screen.getByText('first.jpg')).toBeTruthy();
    expect(screen.getByRole('button', { name: '사진 업로드' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'first.jpg 삭제' })).toBeTruthy();
  });

  it('여러 장 업로드 시 선택한 순서대로 리스트 뒤에 추가한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            item: {
              createdAt: '2026-03-27T09:01:00.000Z',
              fileName: 'second.jpg',
              filePath: 'second.jpg',
              mimeType: 'image/jpeg',
              publicUrl: 'https://example.com/second.jpg',
              size: 100_000,
            },
          }),
          ok: true,
        })
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            item: {
              createdAt: '2026-03-27T09:02:00.000Z',
              fileName: 'third.png',
              filePath: 'third.png',
              mimeType: 'image/png',
              publicUrl: 'https://example.com/third.png',
              size: 90_000,
            },
          }),
          ok: true,
        }),
    );

    render(<AdminPhotoLibraryPanel initialItems={baseItems} />);

    fireEvent.change(screen.getByLabelText('사진 파일 선택', { selector: 'input' }), {
      target: {
        files: [
          new File(['photo-2'], 'second.jpg', { type: 'image/jpeg' }),
          new File(['photo-3'], 'third.png', { type: 'image/png' }),
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('2장의 사진을 업로드했습니다.')).toBeTruthy();
    });

    expect(screen.getByText('first.jpg')).toBeTruthy();
    expect(screen.getByText('second.jpg')).toBeTruthy();
    expect(screen.getByText('third.png')).toBeTruthy();

    const orderLabels = screen
      .getAllByText(/^업로드 순서 \d+$/)
      .map(element => element.textContent);

    expect(orderLabels).toEqual(['업로드 순서 1', '업로드 순서 2', '업로드 순서 3']);
  });

  it('삭제 성공 시 해당 이미지를 목록에서 제거한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          filePath: 'first.jpg',
        }),
        ok: true,
      }),
    );

    render(<AdminPhotoLibraryPanel initialItems={baseItems} />);

    fireEvent.click(screen.getByRole('button', { name: 'first.jpg 삭제' }));

    await waitFor(() => {
      expect(screen.getByText('사진을 삭제했습니다.')).toBeTruthy();
    });

    expect(screen.queryByText('first.jpg')).toBeNull();
    expect(screen.getByText('아직 업로드된 사진이 없습니다.')).toBeTruthy();
  });

  it('삭제 실패 시 카드를 유지하고 오류를 보여준다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          error: '삭제에 실패했습니다.',
        }),
        ok: false,
      }),
    );

    render(<AdminPhotoLibraryPanel initialItems={baseItems} />);

    const card = screen.getByRole('figure', { name: 'first.jpg' });
    fireEvent.click(within(card).getByRole('button', { name: 'first.jpg 삭제' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('삭제에 실패했습니다.');
    });

    expect(screen.getByText('first.jpg')).toBeTruthy();
  });
});
