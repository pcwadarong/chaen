'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';
import { css, cx } from 'styled-system/css';

import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { SearchIcon } from '@/shared/ui/icons/app-icons';
import { Input } from '@/shared/ui/input/input';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';
import { XButton } from '@/shared/ui/x-button/x-button';

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

type ArticleSearchActionsProps = {
  clearText: string;
  hasValue: boolean;
  isPending: boolean;
  onClear: () => void;
  submitText: string;
};

type ArticleSearchPendingStatusProps = {
  isPending: boolean;
  pendingText: string;
};

/**
 * 검색 입력 우측의 clear/submit 액션만 렌더링합니다.
 */
const ArticleSearchActionsBase = ({
  clearText,
  hasValue,
  isPending,
  onClear,
  submitText,
}: ArticleSearchActionsProps) => (
  <>
    {hasValue ? (
      <XButton
        ariaLabel={clearText}
        className={clearButtonClass}
        glyphClassName={clearGlyphClass}
        onClick={onClear}
      />
    ) : null}
    <Button
      aria-label={submitText}
      className={submitButtonClass}
      disabled={isPending}
      size="sm"
      tone="white"
      type="submit"
      variant="ghost"
    >
      <SearchIcon aria-hidden color="text" size="md" />
      <span className={srOnlyClass}>{submitText}</span>
    </Button>
  </>
);

ArticleSearchActionsBase.displayName = 'ArticleSearchActions';

const ArticleSearchActions = React.memo(ArticleSearchActionsBase);

/**
 * pending 상태를 보조기기에만 알리는 상태 텍스트입니다.
 */
const ArticleSearchPendingStatusBase = ({
  isPending,
  pendingText,
}: ArticleSearchPendingStatusProps) =>
  isPending ? (
    <p aria-live="polite" className={srOnlyClass} role="status">
      {pendingText}
    </p>
  ) : null;

ArticleSearchPendingStatusBase.displayName = 'ArticleSearchPendingStatus';

const ArticleSearchPendingStatus = React.memo(ArticleSearchPendingStatusBase);

/**
 * 검색 입력값을 현재 URL 기준 아티클 검색 href로 직렬화합니다.
 *
 * locale 세그먼트는 pathname이 이미 포함하고 있으므로 query string만 갱신합니다.
 */
const createSearchHref = (pathname: string, searchParamsSnapshot: string, query: string) => {
  const nextSearchParams = new URLSearchParams(searchParamsSnapshot);
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
  const searchParamsSnapshot = searchParams?.toString() ?? '';
  const currentQuery = searchParams?.get('q')?.trim() ?? searchQuery;
  const hasInputValue = inputValue.length > 0;

  /**
   * 현재 pathname을 유지한 채 q 파라미터만 교체합니다.
   */
  const replaceQuery = React.useCallback(
    (nextQuery: string) => {
      const href = createSearchHref(pathname, searchParamsSnapshot, nextQuery);

      startTransition(() => {
        router.replace(href);
      });
    },
    [pathname, router, searchParamsSnapshot, startTransition],
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
   * 입력값 변경을 로컬 상태에 반영합니다.
   */
  const handleInputChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  /**
   * 검색어를 즉시 비우고 URL의 q 파라미터를 제거합니다.
   */
  const handleClear = React.useCallback(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    setInputValue('');

    if (searchMode === 'submit-only') return;
    if (!currentQuery) return;

    skipDebounceRef.current = true;
    replaceQuery('');
  }, [currentQuery, replaceQuery, searchMode]);

  /**
   * Enter 제출 시 debounce를 기다리지 않고 즉시 검색을 반영합니다.
   */
  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
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
    },
    [currentQuery, inputValue, onSubmitComplete, replaceQuery],
  );

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
          onChange={handleInputChange}
          placeholder={placeholder}
          role="searchbox"
          type="text"
          value={inputValue}
        />
        <ArticleSearchActions
          clearText={clearText}
          hasValue={hasInputValue}
          isPending={isPending}
          onClear={handleClear}
          submitText={submitText}
        />
      </div>
      <ArticleSearchPendingStatus isPending={isPending} pendingText={pendingText} />
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
  paddingRight: '[4.5rem]',
});

const clearButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  right: '[2.4rem]',
  minWidth: '8',
  minHeight: '8',
  p: '0',
  transform: '[translateY(-50%)]',
  borderRadius: 'full',
});

const clearGlyphClass = css({
  fontSize: '2xl',
});

const submitButtonClass = css({
  position: 'absolute',
  top: '[50%]',
  right: '0',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '9',
  minHeight: '9',
  p: '0',
  transform: '[translateY(-50%)]',
  borderRadius: 'full',
});

const pendingInputClass = css({
  opacity: 0.7,
});
