import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { GuestbookComposeForm } from '@/features/guestbook-compose/ui/guestbook-compose-form';

const createProps = () => ({
  authorBlogUrlPlaceholder: '홈페이지 (선택)',
  authorBlogUrlLabel: '블로그 홈페이지',
  authorNamePlaceholder: '닉네임 1자 이상',
  authorNameLabel: '이름',
  characterCountLabel: '본문 글자 수',
  contentLabel: '방명록 내용',
  contentShortcutHint: 'Ctrl 또는 Command와 Enter를 함께 누르면 전송됩니다.',
  isAdmin: false,
  isReplyMode: false,
  onReplyTargetReset: vi.fn(),
  onSubmit: vi.fn(),
  passwordPlaceholder: '비밀번호 4자 이상',
  passwordLabel: '비밀번호',
  replyPreviewLabel: '답신 대상 내용',
  replyTargetContent: null,
  replyTargetResetLabel: '답신 취소',
  secretLabel: '비밀글',
  submitLabel: '전송',
  textPlaceholder: '내용을 입력하세요.',
});

describe('GuestbookComposeForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('입력 필드와 본문에 명시적인 접근성 라벨을 제공한다', () => {
    render(<GuestbookComposeForm {...createProps()} />);

    expect(screen.getByLabelText('이름')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByLabelText('블로그 홈페이지')).toBeTruthy();
    expect(screen.getByLabelText('방명록 내용')).toBeTruthy();
  });

  it('본문 textarea가 글자 수와 키보드 안내를 보조 설명으로 연결한다', () => {
    render(<GuestbookComposeForm {...createProps()} />);

    const textarea = screen.getByLabelText('방명록 내용');
    const describedBy = textarea.getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(
      screen.getAllByText('Ctrl 또는 Command와 Enter를 함께 누르면 전송됩니다.').length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('status').textContent).toContain('0/3000');
  });

  it('Enter 단독 입력으로는 제출하지 않고 Ctrl+Enter로 제출한다', async () => {
    const onSubmit = vi.fn();

    render(<GuestbookComposeForm {...createProps()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: 'chaen' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('방명록 내용'), { target: { value: '안녕하세요' } });

    fireEvent.keyDown(screen.getByLabelText('방명록 내용'), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByLabelText('방명록 내용'), { ctrlKey: true, key: 'Enter' });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
