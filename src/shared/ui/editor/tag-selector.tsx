'use client';

import React, { useId, useMemo, useState } from 'react';
import { css, cva, cx } from 'styled-system/css';

import { ArrowUpIcon, SearchIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';

type TagItem = {
  id: string;
  label?: string;
  slug: string;
};

type TagSelectorProps = {
  availableTags: TagItem[];
  className?: string;
  onChange: (ids: string[]) => void;
  selectedTagIds: string[];
};

/**
 * 태그 선택 입력에서 사용할 문자열을 검색 친화적으로 정규화합니다.
 */
const normalizeKeyword = (value: string) => value.trim().toLowerCase();

/**
 * 태그가 현재 선택된 목록에 포함되는지 판별합니다.
 */
const hasSelectedTag = (selectedTagIds: string[], tagId: string) => selectedTagIds.includes(tagId);

/**
 * 에디터 전반에서 재사용하는 태그 선택 UI입니다.
 * 검색, 선택/해제, 태그 풀 접기 동작을 하나의 입력 블록으로 제공합니다.
 */
export const TagSelector = ({
  availableTags,
  className,
  onChange,
  selectedTagIds,
}: TagSelectorProps) => {
  const [keyword, setKeyword] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const poolId = useId();
  const normalizedKeyword = normalizeKeyword(keyword);

  const selectedTags = useMemo(
    () => availableTags.filter(tag => hasSelectedTag(selectedTagIds, tag.id)),
    [availableTags, selectedTagIds],
  );

  const filteredTags = useMemo(() => {
    if (!normalizedKeyword) return availableTags;

    return availableTags.filter(tag => {
      const searchableText = normalizeKeyword(`${tag.slug} ${tag.label ?? ''}`);
      return searchableText.includes(normalizedKeyword);
    });
  }, [availableTags, normalizedKeyword]);

  /**
   * 태그 선택 상태를 토글한 다음 상위 컨트롤러에 최신 id 목록을 전달합니다.
   */
  const handleTagToggle = (tagId: string) => {
    if (hasSelectedTag(selectedTagIds, tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
      return;
    }

    onChange([...selectedTagIds, tagId]);
  };

  return (
    <section aria-label="태그 선택기" className={cx(rootClass, className)}>
      <div className={searchFieldClass}>
        <label className={fieldLabelClass} htmlFor={poolId}>
          태그 검색
        </label>
        <div className={inputWrapClass}>
          <SearchIcon aria-hidden className={searchIconClass} color="muted" size="md" />
          <Input
            aria-label="태그 검색"
            className={searchInputClass}
            id={poolId}
            onChange={event => setKeyword(event.target.value)}
            placeholder="태그를 검색하세요"
            type="search"
            value={keyword}
          />
        </div>
      </div>

      <div aria-label="선택된 태그" className={selectedRowClass} role="group">
        {selectedTags.length > 0 ? (
          selectedTags.map(tag => (
            <button
              aria-label={`${tag.slug} 태그 제거`}
              className={selectedChipClass}
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              type="button"
            >
              <span>{tag.slug}</span>
              <span aria-hidden className={chipDismissClass}>
                ×
              </span>
            </button>
          ))
        ) : (
          <p className={helperTextClass}>아직 선택된 태그가 없습니다.</p>
        )}
      </div>

      <div className={poolHeaderClass}>
        <h2 className={poolTitleClass}>태그 풀</h2>
        <button
          aria-controls={`${poolId}-panel`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '태그 풀 접기' : '태그 풀 열기'}
          className={toggleButtonClass}
          onClick={() => setIsExpanded(previous => !previous)}
          type="button"
        >
          <span>{isExpanded ? '접기' : '열기'}</span>
          <ArrowUpIcon
            aria-hidden
            className={cx(toggleIconClass, !isExpanded ? toggleIconCollapsedClass : undefined)}
            color="muted"
            size="sm"
          />
        </button>
      </div>

      {isExpanded ? (
        <div className={poolClass} id={`${poolId}-panel`}>
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => {
              const isSelected = hasSelectedTag(selectedTagIds, tag.id);

              return (
                <button
                  aria-label={`${tag.slug} ${isSelected ? '태그 해제' : '태그 선택'}`}
                  aria-pressed={isSelected}
                  className={chipRecipe({ selected: isSelected })}
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  type="button"
                >
                  <span className={chipLabelClass}>{tag.slug}</span>
                  <span className={srOnlyClass}>
                    {` ${isSelected ? '태그 해제' : '태그 선택'}`}
                  </span>
                </button>
              );
            })
          ) : (
            <p className={helperTextClass}>
              {availableTags.length > 0 ? '검색 결과가 없습니다.' : '사용 가능한 태그가 없습니다.'}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
};

const rootClass = css({
  display: 'grid',
  gap: '4',
});

const searchFieldClass = css({
  display: 'grid',
  gap: '2',
});

const fieldLabelClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text',
});

const inputWrapClass = css({
  position: 'relative',
});

const searchIconClass = css({
  position: 'absolute',
  left: '3',
  top: '[50%]',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
});

const searchInputClass = css({
  paddingLeft: '10',
});

const selectedRowClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  minHeight: '[2.5rem]',
  alignItems: 'flex-start',
});

const helperTextClass = css({
  fontSize: 'sm',
  color: 'muted',
});

const poolHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const poolTitleClass = css({
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text',
});

const toggleButtonClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  fontSize: 'sm',
  color: 'muted',
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const toggleIconClass = css({
  transition: 'transform',
});

const toggleIconCollapsedClass = css({
  transform: 'rotate(180deg)',
});

const poolClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

const chipRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '[2.25rem]',
    px: '3',
    borderRadius: 'full',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: 'sm',
    transition: 'colors',
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    selected: {
      true: {
        borderColor: 'primary',
        background: 'primary',
        color: 'primaryContrast',
      },
      false: {
        borderColor: 'border',
        background: 'surface',
        color: 'text',
        _hover: {
          borderColor: 'borderStrong',
        },
      },
    },
  },
});

const chipLabelClass = css({
  fontWeight: 'semibold',
});

const selectedChipClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  minHeight: '[2.25rem]',
  px: '3',
  borderRadius: 'full',
  background: 'surfaceMuted',
  color: 'text',
  fontSize: 'sm',
  _focusVisible: {
    outline: '[2px solid var(--colors-focus-ring)]',
    outlineOffset: '[2px]',
  },
});

const chipDismissClass = css({
  fontSize: 'md',
  lineHeight: '[1]',
});

const srOnlyClass = css({
  position: 'absolute',
  width: '[1px]',
  height: '[1px]',
  padding: '0',
  margin: '[-1px]',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
});
