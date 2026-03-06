import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';

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

  it('열릴 때 지정한 초기 포커스 요소로 이동한다', async () => {
    const inputRef = createRef<HTMLInputElement>();

    render(
      <Modal closeAriaLabel="닫기" initialFocusRef={inputRef} isOpen onClose={vi.fn()}>
        <input ref={inputRef} aria-label="비밀번호" />
      </Modal>,
    );

    await waitFor(() => {
      expect(inputRef.current).toBe(document.activeElement);
    });
  });

  it('Tab과 Shift+Tab 키로 모달 내부 포커스를 순환시킨다', async () => {
    render(
      <Modal closeAriaLabel="닫기" isOpen onClose={vi.fn()}>
        <div>
          <button type="button">첫 번째</button>
          <button type="button">마지막</button>
        </div>
      </Modal>,
    );

    const closeButton = await screen.findByRole('button', { name: '닫기' });
    const lastButton = screen.getByRole('button', { name: '마지막' });

    lastButton.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(closeButton).toBe(document.activeElement);

    closeButton.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(lastButton).toBe(document.activeElement);
  });

  it('모달이 닫히면 이전 활성 요소로 포커스를 복원한다', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button type="button">트리거</button>
        <Modal closeAriaLabel="닫기" isOpen={false} onClose={onClose}>
          <div>본문</div>
        </Modal>
      </>,
    );
    const triggerButton = screen.getByRole('button', { name: '트리거' });
    triggerButton.focus();
    expect(triggerButton).toBe(document.activeElement);

    rerender(
      <>
        <button type="button">트리거</button>
        <Modal closeAriaLabel="닫기" isOpen onClose={onClose}>
          <div>본문</div>
        </Modal>
      </>,
    );

    await screen.findByRole('dialog');

    rerender(
      <>
        <button type="button">트리거</button>
        <Modal closeAriaLabel="닫기" isOpen={false} onClose={onClose}>
          <div>본문</div>
        </Modal>
      </>,
    );

    await waitFor(() => {
      expect(triggerButton).toBe(document.activeElement);
    });
  });
});
