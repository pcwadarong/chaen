import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SlugInput } from '@/shared/ui/editor/slug-input';

describe('SlugInput', () => {
  it('slug 입력 시 허용되지 않는 문자를 제거한 값을 전달한다', () => {
    const onChange = vi.fn();

    render(<SlugInput onChange={onChange} value="" />);

    fireEvent.change(screen.getByRole('textbox', { name: '슬러그' }), {
      target: { value: 'Optimize Web Accessibility!' },
    });

    expect(onChange).toHaveBeenCalledWith('optimize-web-accessibility');
  });

  it('값이 비어 있으면 인라인 에러를 노출한다', () => {
    render(<SlugInput onChange={vi.fn()} value="" />);

    expect(screen.getByText('슬러그를 입력해주세요.')).toBeTruthy();
  });

  it('발행 후 잠금 상태면 읽기 전용 입력으로 렌더링한다', () => {
    render(<SlugInput isPublished onChange={vi.fn()} value="fixed-slug" />);

    const input = screen.getByRole('textbox', { name: '슬러그' });

    expect(input.getAttribute('readonly')).toBe('');
    expect(screen.getByText('발행 후에는 슬러그를 변경할 수 없습니다.')).toBeTruthy();
  });
});
