import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { TagSelector } from '@/shared/ui/tag-selector/tag-selector';

const availableTags = [
  { id: 'tag-1', label: '프론트엔드', slug: 'frontend' },
  { id: 'tag-2', label: '리액트', slug: 'react' },
  { id: 'tag-3', label: '타입스크립트', slug: 'typescript' },
];

const setup = (selectedTagSlugs: string[] = [], onChange = vi.fn()) => {
  render(
    <TagSelector
      availableTags={availableTags}
      onChange={onChange}
      selectedTagSlugs={selectedTagSlugs}
    />,
  );

  return { onChange };
};

describe('TagSelector', () => {
  it('태그 풀에서 선택한 태그 slug 목록을 onChange로 전달한다', () => {
    const { onChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: '리액트 태그 선택' }));

    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('선택된 태그를 다시 누르면 slug 목록에서 제거한다', () => {
    const { onChange } = setup(['frontend', 'react']);

    fireEvent.click(screen.getByRole('button', { name: '리액트 태그 해제' }));

    expect(onChange).toHaveBeenCalledWith(['frontend']);
  });

  it('태그 풀을 접고 다시 열 수 있다', () => {
    setup();

    const toggleButton = screen.getByRole('button', { name: '태그 풀 접기' });
    fireEvent.click(toggleButton);

    expect(screen.queryByRole('button', { name: '프론트엔드 태그 선택' })).toBeNull();
    expect(screen.getByRole('button', { name: '태그 풀 열기' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '태그 풀 열기' }));

    expect(screen.getByRole('button', { name: '프론트엔드 태그 선택' })).toBeTruthy();
  });

  it('화면에는 번역된 label을 보여준다', () => {
    setup();

    expect(screen.getByText('프론트엔드')).toBeTruthy();
    expect(screen.getByText('리액트')).toBeTruthy();
    expect(screen.queryByText('frontend')).toBeNull();
  });
});
