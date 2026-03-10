import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ToastViewport } from '@/shared/ui/toast/toast';

describe('ToastViewport', () => {
  it('상태별 토스트를 role과 설명 텍스트와 함께 렌더링한다', () => {
    render(
      <ToastViewport
        closeLabel="닫기"
        items={[
          {
            id: 'success-1',
            message: '저장되었습니다.',
            description: '댓글이 정상적으로 등록되었습니다.',
            tone: 'success',
          },
          { id: 'error-1', message: '실패했습니다.', tone: 'error' },
        ]}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByRole('status').textContent).toContain('저장되었습니다.');
    expect(screen.getByRole('status').textContent).toContain('댓글이 정상적으로 등록되었습니다.');
    expect(screen.getByRole('alert').textContent).toContain('실패했습니다.');
    expect(screen.getAllByRole('button', { name: '닫기' })).toHaveLength(2);
  });

  it('닫기 버튼 클릭 시 해당 토스트 id를 전달한다', () => {
    const onClose = vi.fn();

    render(
      <ToastViewport
        closeLabel="닫기"
        items={[{ id: 'toast-1', message: '저장되었습니다.', tone: 'success' }]}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledWith('toast-1');
  });
});
