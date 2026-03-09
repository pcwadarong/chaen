'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';
import { css, cx } from 'styled-system/css';

import { usePathname, useRouter } from '@/i18n/navigation';
import { buttonRecipe } from '@/shared/ui/button/button.recipe';
import { SearchIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

type ArticleSearchFormProps = {
  autoFocus?: boolean;
  clearText: string;
  fullWidth?: boolean;
  onSubmitComplete?: () => void;
  pendingText: string;
  placeholder: string;
  searchQuery: string;
  searchMode?: 'debounced' | 'submit-only';
  submitText: string;
};

/**
 * 검색 입력값을 현재 URL 기준 아티클 검색 href로 직렬화합니다.
 *
 * locale 세그먼트는 pathname이 이미 포함하고 있으므로 query string만 갱신합니다.
 */
const createSearchHref = (
  pathname: string,
  searchParams: URLSearchParams | null,
  query: string,
) => {
  const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? '');
  const normalizedQuery = query.trim();

  if (normalizedQuery) nextSearchParams.set('q', normalizedQuery);
  else nextSearchParams.delete('q');
  nextSearchParams.delete('tag');

  const nextQueryString = nextSearchParams.toString();
  return nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
};

/**
 * 아티클 목록 페이지의 클라이언트 검색 폼입니다.
 *
 * URL을 단일 진실 공급원으로 두고 입력값은 URL 상태를 따라가는 controlled input으로 유지합니다.
 */
export const ArticleSearchForm = ({
  autoFocus = false,
  clearText,
  fullWidth = false,
  onSubmitComplete,
  pendingText,
  placeholder,
  searchQuery,
  searchMode = 'debounced',
  submitText,
}: ArticleSearchFormProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const [isAwaitingSubmitCompletion, setIsAwaitingSubmitCompletion] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(searchQuery);
  const debounceTimerRef = React.useRef<number | null>(null);
  const skipDebounceRef = React.useRef(false);
  const currentQuery = searchParams?.get('q')?.trim() ?? searchQuery;

  /**
   * 현재 pathname을 유지한 채 q 파라미터만 교체합니다.
   */
  const replaceQuery = React.useCallback(
    (nextQuery: string) => {
      const href = createSearchHref(pathname, searchParams, nextQuery);

      startTransition(() => {
        router.replace(href);
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  React.useEffect(() => {
    skipDebounceRef.current = true;
    setInputValue(currentQuery);
  }, [currentQuery]);

  React.useEffect(() => {
    if (!isAwaitingSubmitCompletion || isPending) return;

    setIsAwaitingSubmitCompletion(false);
    onSubmitComplete?.();
  }, [isAwaitingSubmitCompletion, isPending, onSubmitComplete]);

  /**
   * URL 동기화로 바뀐 값은 다시 검색하지 않고,
   * 사용자가 직접 입력한 변경만 debounce 검색으로 반영합니다.
   */
  React.useEffect(() => {
    if (searchMode !== 'debounced') return;

    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    if (inputValue.trim() === currentQuery) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      replaceQuery(inputValue);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentQuery, inputValue, replaceQuery, searchMode]);

  /**
   * Enter 제출 시 debounce를 기다리지 않고 즉시 검색을 반영합니다.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (inputValue.trim() === currentQuery) {
      onSubmitComplete?.();
      return;
    }

    skipDebounceRef.current = true;
    setIsAwaitingSubmitCompletion(true);
    replaceQuery(inputValue);
  };

  /**
   * 검색어를 즉시 비우고 URL의 q 파라미터를 제거합니다.
   */
  const handleClear = () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    setInputValue('');

    if (searchMode === 'submit-only') return;
    if (!currentQuery) return;

    skipDebounceRef.current = true;
    replaceQuery('');
  };

  return (
    <form
      aria-busy={isPending}
      className={cx(formClass, fullWidth ? fullWidthClass : undefined)}
      onSubmit={handleSubmit}
      role="search"
    >
      <div className={inputWrapClass}>
        <Input
          aria-label={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          className={cx(inputPaddingClass, isPending ? pendingInputClass : undefined)}
          enterKeyHint="search"
          name="q"
          onChange={event => setInputValue(event.target.value)}
          placeholder={placeholder}
          role="searchbox"
          type="text"
          value={inputValue}
        />
        {inputValue ? (
          <button
            aria-label={clearText}
            className={cx(buttonRecipe({ tone: 'white', variant: 'ghost' }), clearButtonClass)}
            onClick={handleClear}
            type="button"
          >
            ×
          </button>
        ) : null}
        <button
          aria-label={submitText}
          className={cx(buttonRecipe({ tone: 'white', variant: 'ghost' }), submitButtonClass)}
          disabled={isPending}
          type="submit"
        >
          <SearchIcon aria-hidden color="text" size="md" />
          <span className={srOnlyClass}>{submitText}</span>
        </button>
      </div>
      {isPending ? (
        <p aria-live="polite" className={srOnlyClass} role="status">
          {pendingText}
        </p>
      ) : null}
    </form>
  );
};

const formClass = css({
  width: '[min(100%, 18rem)]',
});

const fullWidthClass = css({
  width: 'full',
});

const inputWrapClass = css({
  position: 'relative',
});

const inputPaddingClass = css({
  minHeight: '12',
  paddingRight: '[6.5rem]',
});

const clearButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  right: '[3.6rem]',
  minWidth: '8',
  minHeight: '8',
  p: '0',
  transform: '[translateY(-50%)]',
  borderRadius: 'pill',
});

const submitButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  right: '1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '9',
  minHeight: '9',
  p: '0',
  transform: '[translateY(-50%)]',
  borderRadius: 'pill',
});

const pendingInputClass = css({
  opacity: 0.7,
});
