import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { SlugInput } from '@/shared/ui/slug-input/slug-input';

describe('SlugInput', () => {
  it('slug 입력 시 원본 문자열을 그대로 전달한다', () => {
    const onChange = vi.fn();

    render(<SlugInput onChange={onChange} value="" />);

    fireEvent.change(screen.getByRole('textbox', { name: '슬러그' }), {
      target: { value: 'Optimize Web Accessibility!' },
    });

    expect(onChange).toHaveBeenCalledWith('Optimize Web Accessibility!');
  });

  it('기본 상태에서는 빈 값이어도 인라인 에러를 바로 노출하지 않는다', () => {
    render(<SlugInput onChange={vi.fn()} value="" />);

    expect(screen.queryByText('슬러그를 입력해주세요.')).toBeNull();
  });

  it('showEmptyError가 켜져 있으면 빈 값 에러를 노출한다', () => {
    render(<SlugInput onChange={vi.fn()} showEmptyError value="" />);

    expect(screen.getByText('슬러그를 입력해주세요.')).toBeTruthy();
  });

  it('여러 인스턴스를 렌더링해도 각 입력 id가 충돌하지 않는다', () => {
    render(
      <>
        <SlugInput onChange={vi.fn()} value="first-slug" />
        <SlugInput onChange={vi.fn()} value="second-slug" />
      </>,
    );

    const [firstInput, secondInput] = screen.getAllByRole('textbox', { name: '슬러그' });

    expect(firstInput.getAttribute('id')).toBeTruthy();
    expect(firstInput.getAttribute('id')).not.toBe(secondInput.getAttribute('id'));
  });

  it('하이픈 입력 자체는 원본 그대로 유지한다', () => {
    const onChange = vi.fn();

    render(<SlugInput onChange={onChange} value="" />);

    fireEvent.change(screen.getByRole('textbox', { name: '슬러그' }), {
      target: { value: '-' },
    });

    expect(onChange).toHaveBeenCalledWith('-');
  });

  it('사용 가능 확인 시 정규화된 slug로 검사하고 입력값도 정규화한다', async () => {
    const onCheckDuplicate = vi.fn().mockResolvedValue(false);

    const SlugInputHarness = () => {
      const [value, setValue] = React.useState('');

      return <SlugInput onChange={setValue} onCheckDuplicate={onCheckDuplicate} value={value} />;
    };

    render(<SlugInputHarness />);

    const input = screen.getByRole('textbox', { name: '슬러그' });

    fireEvent.change(input, {
      target: { value: 'Hello World!!' },
    });

    expect((input as HTMLInputElement).value).toBe('Hello World!!');

    fireEvent.click(screen.getByRole('button', { name: '사용 가능 확인' }));

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('hello-world');
    });
    expect(onCheckDuplicate).toHaveBeenCalledWith('hello-world');
  });

  it('중복 확인 전에는 빈 값 경고를 바로 띄우지 않고, 확인 버튼을 누르면 빈 값 에러를 노출한다', async () => {
    const onCheckDuplicate = vi.fn();

    render(<SlugInput onChange={vi.fn()} onCheckDuplicate={onCheckDuplicate} value="" />);

    fireEvent.click(screen.getByRole('button', { name: '사용 가능 확인' }));

    expect(screen.getByText('슬러그를 입력해주세요.')).toBeTruthy();
    expect(onCheckDuplicate).not.toHaveBeenCalled();
  });

  it('하이픈만 있는 값은 중복 확인 전에 형식 오류를 노출한다', async () => {
    const onCheckDuplicate = vi.fn();

    render(<SlugInput onChange={vi.fn()} onCheckDuplicate={onCheckDuplicate} value="-" />);

    fireEvent.click(screen.getByRole('button', { name: '사용 가능 확인' }));

    expect(
      screen.getByText('슬러그는 하이픈 앞뒤에 영문 소문자 또는 숫자가 있어야 합니다.'),
    ).toBeTruthy();
    expect(onCheckDuplicate).not.toHaveBeenCalled();
  });

  it('중복 확인 결과가 이미 사용 중이면 다른 슬러그를 쓰라는 경고를 노출한다', async () => {
    const onCheckDuplicate = vi.fn().mockResolvedValue(true);

    render(
      <SlugInput onChange={vi.fn()} onCheckDuplicate={onCheckDuplicate} value="existing-slug" />,
    );

    fireEvent.click(screen.getByRole('button', { name: '사용 가능 확인' }));

    await screen.findByText('이미 사용 중인 슬러그입니다. 다른 슬러그를 사용해주세요.');

    expect(onCheckDuplicate).toHaveBeenCalledWith('existing-slug');
  });

  it('중복 확인 결과가 사용 가능하면 성공 메시지를 노출한다', async () => {
    const onCheckDuplicate = vi.fn().mockResolvedValue(false);

    render(<SlugInput onChange={vi.fn()} onCheckDuplicate={onCheckDuplicate} value="new-slug" />);

    fireEvent.click(screen.getByRole('button', { name: '사용 가능 확인' }));

    await screen.findByText('사용 가능한 슬러그입니다.');
  });

  it('이전 slug의 늦은 응답이 현재 상태를 덮어쓰지 않는다', async () => {
    let resolveFirst: ((value: boolean) => void) | null = null;
    let resolveSecond: ((value: boolean) => void) | null = null;
    const onCheckDuplicate = vi.fn((slug: string) => {
      if (slug === 'first-slug') {
        return new Promise<boolean>(resolve => {
          resolveFirst = resolve;
        });
      }

      return new Promise<boolean>(resolve => {
        resolveSecond = resolve;
      });
    });
    const { rerender } = render(
      <SlugInput onChange={vi.fn()} onCheckDuplicate={onCheckDuplicate} value="first-slug" />,
    );

    fireEvent.click(screen.getByRole('button', { name: '사용 가능 확인' }));

    rerender(
      <SlugInput onChange={vi.fn()} onCheckDuplicate={onCheckDuplicate} value="second-slug" />,
    );
    fireEvent.click(screen.getByRole('button', { name: '사용 가능 확인' }));

    expect(resolveSecond).toBeTypeOf('function');
    resolveSecond!(false);
    await screen.findByText('사용 가능한 슬러그입니다.');

    expect(resolveFirst).toBeTypeOf('function');
    resolveFirst!(true);

    await waitFor(() => {
      expect(
        screen.queryByText('이미 사용 중인 슬러그입니다. 다른 슬러그를 사용해주세요.'),
      ).toBeNull();
    });
  });

  it('발행 후 잠금 상태면 읽기 전용 입력으로 렌더링한다', () => {
    render(<SlugInput isPublished onChange={vi.fn()} value="fixed-slug" />);

    const input = screen.getByRole('textbox', { name: '슬러그' });

    expect(input.getAttribute('readonly')).toBe('');
    expect(screen.getByText('발행 후에는 슬러그를 변경할 수 없습니다.')).toBeTruthy();
  });
});
