import { render, screen } from '@testing-library/react';
import React from 'react';

import { Button } from '@/shared/ui/button/button';

describe('Button', () => {
  it('아이콘과 라벨을 함께 렌더링한다', () => {
    render(
      <Button leadingVisual={<svg aria-hidden viewBox="0 0 16 16" />} tone="primary">
        저장
      </Button>,
    );

    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy();
  });

  it('disabled 상태를 버튼 속성으로 반영한다', () => {
    render(
      <Button disabled tone="black">
        비활성
      </Button>,
    );

    expect(screen.getByRole('button', { name: '비활성' })).toHaveProperty('disabled', true);
  });

  it('asChild로 단일 커스텀 엘리먼트를 스타일링할 수 있다', () => {
    render(
      <Button asChild tone="white" variant="ghost">
        <span role="button">프로젝트</span>
      </Button>,
    );

    expect(screen.getByRole('button', { name: '프로젝트' })).toBeTruthy();
  });

  it('전달된 className을 기본 recipe 클래스와 병합한다', () => {
    render(
      <Button className="custom-class" tone="primary">
        병합
      </Button>,
    );

    expect(screen.getByRole('button', { name: '병합' }).className).toContain('custom-class');
  });
});
