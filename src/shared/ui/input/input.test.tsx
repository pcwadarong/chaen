import { render, screen } from '@testing-library/react';
import React from 'react';

import { Input } from '@/shared/ui/input/input';

describe('Input', () => {
  it('search type과 접근성 라벨이 주어지면, Input은 검색 입력을 searchbox role로 노출해야 한다', () => {
    render(<Input aria-label="검색어" placeholder="검색어를 입력하세요" type="search" />);

    expect(screen.getByRole('searchbox', { name: '검색어' })).toBeTruthy();
  });

  it('외부 className이 주어지면, Input은 기본 recipe 클래스에 사용자 클래스를 병합해야 한다', () => {
    render(<Input aria-label="이름" className="custom-class" type="text" />);

    expect(screen.getByLabelText('이름').className).toContain('custom-class');
  });
});
