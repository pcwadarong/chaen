import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { CommentComposeForm } from '@/shared/ui/comment-compose-form/comment-compose-form';

const createProps = () => ({
  authorBlogUrlLabel: '블로그 홈페이지',
  authorBlogUrlInvalidMessage: '홈페이지 주소는 http:// 또는 https://로 시작해야 합니다.',
  authorBlogUrlPlaceholder: '홈페이지 (선택)',
  allowSecretToggle: true,
  authorMode: 'manual' as const,
  authorNamePlaceholder: '닉네임 1자 이상',
  authorNameLabel: '이름',
  characterCountLabel: '본문 글자 수',
  contentLabel: '방명록 내용',
  contentShortcutHint: 'Ctrl 또는 Command와 Enter를 함께 누르면 전송됩니다.',
  isReplyMode: false,
  onReplyTargetReset: vi.fn(),
  onSubmit: vi.fn(),
  passwordPlaceholder: '비밀번호 4자 이상',
  passwordLabel: '비밀번호',
  presetAuthorName: '',
  replyPreviewLabel: '답신 대상 내용',
  replyTargetContent: null,
  replyTargetResetLabel: '답신 취소',
  secretLabel: '비밀글',
  submitLabel: '전송',
  textareaAutoResize: true,
  textareaRows: 1,
  textPlaceholder: '내용을 입력하세요.',
});

describe('CommentComposeForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('입력 필드와 본문에 명시적인 접근성 라벨을 제공한다', () => {
    render(<CommentComposeForm {...createProps()} />);

    expect(screen.getByLabelText('이름')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByLabelText('블로그 홈페이지')).toBeTruthy();
    expect(screen.getByLabelText('방명록 내용')).toBeTruthy();
  });

  it('본문 textarea가 글자 수와 키보드 안내를 보조 설명으로 연결한다', () => {
    render(<CommentComposeForm {...createProps()} />);

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

    render(<CommentComposeForm {...createProps()} onSubmit={onSubmit} />);

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

  it('위험한 블로그 URL은 클라이언트에서 제출 전에 막고 검증 메시지를 노출한다', async () => {
    const onSubmit = vi.fn();

    render(<CommentComposeForm {...createProps()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: 'chaen' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('블로그 홈페이지'), {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.change(screen.getByLabelText('방명록 내용'), { target: { value: '안녕하세요' } });
    fireEvent.click(screen.getByRole('button', { name: '전송' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(
        '홈페이지 주소는 http:// 또는 https://로 시작해야 합니다.',
      );
    });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('블로그 홈페이지'), {
      target: { value: 'https://example.com' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText('홈페이지 주소는 http:// 또는 https://로 시작해야 합니다.'),
      ).toBeNull();
    });
  });

  it('임베디드 레이아웃에서 textarea 행 수와 autoResize 옵션을 제어할 수 있다', () => {
    render(
      <CommentComposeForm
        {...createProps()}
        layout="embedded"
        textareaAutoResize={false}
        textareaRows={4}
      />,
    );

    const textarea = screen.getByLabelText('방명록 내용') as HTMLTextAreaElement;

    expect(textarea.rows).toBe(4);

    fireEvent.change(textarea, {
      target: {
        value: '줄바꿈이 있는\n댓글 초안입니다.',
      },
    });

    expect(textarea.style.height).toBe('');
  });

  it('preset 작성자 모드에서는 프로필 입력 없이 preset 작성자 이름으로 제출한다', async () => {
    const onSubmit = vi.fn();

    render(
      <CommentComposeForm
        {...createProps()}
        allowSecretToggle={false}
        authorMode="preset"
        onSubmit={onSubmit}
        presetAuthorName="admin"
      />,
    );

    fireEvent.change(screen.getByLabelText('방명록 내용'), { target: { value: '운영자 답글' } });
    fireEvent.click(screen.getByRole('button', { name: '전송' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        authorBlogUrl: '',
        authorName: 'admin',
        content: '운영자 답글',
        isSecret: false,
        password: '',
      });
    });
  });
});
