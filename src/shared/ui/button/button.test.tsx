import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { Button } from '@/shared/ui/button/button';

import '@testing-library/jest-dom/vitest';

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

  it('disabled asChild anchor는 aria-disabled와 클릭 가드를 가진다', () => {
    const handleClick = vi.fn();
    const AnchorLike = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />;

    render(
      <Button asChild disabled tone="white" variant="ghost">
        <AnchorLike href="https://example.com/project" onClick={handleClick}>
          프로젝트
        </AnchorLike>
      </Button>,
    );

    const link = screen.getByRole('link', { name: '프로젝트' });
    fireEvent.click(link);

    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('asChild native button에는 type을 전달한다', () => {
    render(
      <Button asChild tone="primary" type="submit">
        <button>저장</button>
      </Button>,
    );

    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('type', 'submit');
  });

  it('asChild에 유효한 단일 엘리먼트가 없으면 에러를 던진다', () => {
    expect(() =>
      render(
        <Button asChild tone="white">
          텍스트
        </Button>,
      ),
    ).toThrow('Button with asChild requires a single React element child.');
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
