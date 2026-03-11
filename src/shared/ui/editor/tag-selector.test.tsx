import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { TagSelector } from '@/shared/ui/editor/tag-selector';

const availableTags = [
  { id: 'tag-1', label: 'Frontend', slug: 'frontend' },
  { id: 'tag-2', label: 'React', slug: 'react' },
  { id: 'tag-3', label: 'TypeScript', slug: 'typescript' },
];

const setup = (selectedTagIds: string[] = [], onChange = vi.fn()) => {
  render(
    <TagSelector
      availableTags={availableTags}
      onChange={onChange}
      selectedTagIds={selectedTagIds}
    />,
  );

  return { onChange };
};

describe('TagSelector', () => {
  it('검색어를 대소문자 구분 없이 적용해 태그 풀을 필터링한다', () => {
    setup();

    fireEvent.change(screen.getByRole('searchbox', { name: '태그 검색' }), {
      target: { value: 'ReAc' },
    });

    expect(screen.getByRole('button', { name: '#react 태그 선택' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '#frontend 태그 선택' })).toBeNull();
  });

  it('태그 풀에서 선택한 태그 id 목록을 onChange로 전달한다', () => {
    const { onChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: '#react 태그 선택' }));

    expect(onChange).toHaveBeenCalledWith(['tag-2']);
  });

  it('선택된 태그 행의 제거 버튼으로 태그를 해제한다', () => {
    const { onChange } = setup(['tag-1', 'tag-2']);
    const selectedRegion = screen.getByRole('group', { name: '선택된 태그' });

    expect(within(selectedRegion).getByText('#frontend')).toBeTruthy();
    expect(within(selectedRegion).getByText('#react')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '#react 태그 제거' }));

    expect(onChange).toHaveBeenCalledWith(['tag-1']);
  });

  it('태그 풀을 접고 다시 열 수 있다', () => {
    setup();

    const toggleButton = screen.getByRole('button', { name: '태그 풀 접기' });
    fireEvent.click(toggleButton);

    expect(screen.queryByRole('button', { name: '#frontend 태그 선택' })).toBeNull();
    expect(screen.getByRole('button', { name: '태그 풀 열기' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '태그 풀 열기' }));

    expect(screen.getByRole('button', { name: '#frontend 태그 선택' })).toBeTruthy();
  });
});
