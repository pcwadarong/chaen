'use client';

import React, { useCallback, useId, useState } from 'react';
import { css, cva, cx } from 'styled-system/css';

import { ArrowUpIcon } from '@/shared/ui/icons/app-icons';

type TagItem = {
  group?: string;
  id: string;
  label: string;
  slug: string;
};

type TagSelectorProps = {
  availableTags: TagItem[];
  className?: string;
  emptyText?: string;
  onChange: (slugs: string[]) => void;
  onExpandedChange?: (isExpanded: boolean) => void;
  poolLabel?: string;
  poolTitle?: string;
  selectLabel?: string;
  selectedTagSlugs: string[];
};

/**
 * 태그가 현재 선택된 slug 목록에 포함되는지 판별합니다.
 */
const hasSelectedTag = (selectedTagSlugs: string[], tagSlug: string) =>
  selectedTagSlugs.includes(tagSlug);

/**
 * 에디터 전반에서 재사용하는 태그 선택 UI입니다.
 * 태그 풀 안에서만 선택 상태를 토글하고, 선택값은 slug 배열로 유지합니다.
 */
const TagSelectorBase = ({
  availableTags,
  className,
  emptyText = '사용 가능한 태그가 없습니다.',
  onChange,
  onExpandedChange,
  poolLabel = '태그 선택기',
  poolTitle = 'Tags',
  selectLabel = '태그',
  selectedTagSlugs,
}: TagSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const poolId = useId();

  /**
   * 태그 선택 상태를 토글한 다음 상위 컨트롤러에 최신 slug 목록을 전달합니다.
   */
  const handleTagToggle = useCallback(
    (tagSlug: string) => {
      if (hasSelectedTag(selectedTagSlugs, tagSlug)) {
        onChange(selectedTagSlugs.filter(slug => slug !== tagSlug));
        return;
      }

      onChange([...selectedTagSlugs, tagSlug]);
    },
    [onChange, selectedTagSlugs],
  );

  /**
   * 버튼에 저장된 slug를 읽어 공통 태그 토글 handler로 위임합니다.
   */
  const handleTagClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const tagSlug = event.currentTarget.dataset.tagSlug;

      if (!tagSlug) {
        return;
      }

      handleTagToggle(tagSlug);
    },
    [handleTagToggle],
  );

  const handleExpandedToggle = useCallback(() => {
    setIsExpanded(previous => {
      const nextExpanded = !previous;
      onExpandedChange?.(nextExpanded);
      return nextExpanded;
    });
  }, [onExpandedChange]);

  return (
    <section aria-label={poolLabel} className={cx(rootClass, className)}>
      <div className={poolHeaderClass}>
        <h2 className={poolTitleClass}>{poolTitle}</h2>
        <button
          aria-controls={`${poolId}-panel`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `${selectLabel} 풀 접기` : `${selectLabel} 풀 열기`}
          className={toggleButtonClass}
          onClick={handleExpandedToggle}
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
          {availableTags.length > 0 ? (
            availableTags.map((tag, index) => {
              const isSelected = hasSelectedTag(selectedTagSlugs, tag.slug);
              const previousTagGroup = index > 0 ? availableTags[index - 1]?.group : undefined;
              const shouldRenderGroupGap =
                index > 0 &&
                typeof tag.group === 'string' &&
                typeof previousTagGroup === 'string' &&
                previousTagGroup !== tag.group;

              return (
                <React.Fragment key={tag.id}>
                  {shouldRenderGroupGap ? (
                    <span
                      aria-hidden
                      className={groupSeparatorClass}
                      data-group-separator={tag.group}
                    />
                  ) : null}
                  <button
                    aria-label={`${tag.label} ${
                      isSelected ? `${selectLabel} 해제` : `${selectLabel} 선택`
                    }`}
                    aria-pressed={isSelected}
                    className={chipRecipe({ selected: isSelected })}
                    data-tag-slug={tag.slug}
                    onClick={handleTagClick}
                    type="button"
                  >
                    <span className={chipLabelClass}>{tag.label}</span>
                  </button>
                </React.Fragment>
              );
            })
          ) : (
            <p className={helperTextClass}>{emptyText}</p>
          )}
        </div>
      ) : null}
    </section>
  );
};

TagSelectorBase.displayName = 'TagSelector';

export const TagSelector = React.memo(TagSelectorBase);

const rootClass = css({
  display: 'grid',
  gap: '4',
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

const groupSeparatorClass = css({
  flexBasis: 'full',
  height: '2',
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
    transition: 'common',
    _focusVisible: {
      outline: '[2px solid var(--colors-focus-ring)]',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    selected: {
      false: {
        borderColor: 'border',
        background: 'surface',
        color: 'muted',
        _hover: {
          borderColor: 'borderStrong',
          color: 'text',
        },
      },
      true: {
        borderColor: 'transparent',
        background: 'primary',
        color: 'primaryContrast',
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const chipLabelClass = css({
  lineHeight: 'tight',
});
