import { render, screen } from '@testing-library/react';
import React from 'react';

import { Input } from '@/shared/ui/input/input';

describe('Input', () => {
  it('입력 필드를 렌더링한다', () => {
    render(<Input aria-label="검색어" placeholder="검색어를 입력하세요" type="search" />);

    expect(screen.getByRole('searchbox', { name: '검색어' })).toBeTruthy();
  });

  it('전달된 className을 기본 recipe 클래스와 병합한다', () => {
    render(<Input aria-label="이름" className="custom-class" type="text" />);

    expect(screen.getByLabelText('이름').className).toContain('custom-class');
  });
});
