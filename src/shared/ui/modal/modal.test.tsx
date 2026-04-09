import { render, screen } from '@testing-library/react';
import React from 'react';

import { Modal } from '@/shared/ui/modal/modal';

describe('Modal', () => {
  it('다이얼로그 라벨을 제공하면 보조기기 이름으로 노출한다', async () => {
    render(
      <Modal
        ariaDescribedBy="modal-description"
        ariaLabelledBy="modal-title"
        closeAriaLabel="닫기"
        isOpen
        onClose={vi.fn()}
      >
        <div>
          <h2 id="modal-title">테스트 모달</h2>
          <p id="modal-description">설명 텍스트</p>
        </div>
      </Modal>,
    );

    const dialog = await screen.findByRole('dialog', { name: '테스트 모달' });

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('modal-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('modal-description');
  });
});
