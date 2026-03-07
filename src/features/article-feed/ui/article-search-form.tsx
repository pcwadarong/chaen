'use client';

import { css } from '@emotion/react';
import { useSearchParams } from 'next/navigation';
import React from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { Button, getButtonStyle } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';
import { srOnlyStyle } from '@/shared/ui/styles/sr-only-style';

type ArticleSearchFormProps = {
  clearText: string;
  pendingText: string;
  placeholder: string;
  searchQuery: string;
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

  const nextQueryString = nextSearchParams.toString();
  return nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
};

/**
 * 아티클 목록 페이지의 클라이언트 검색 폼입니다.
 *
 * URL을 단일 진실 공급원으로 두고 입력값은 URL 상태를 따라가는 controlled input으로 유지합니다.
 */
export const ArticleSearchForm = ({
  clearText,
  pendingText,
  placeholder,
  searchQuery,
  submitText,
}: ArticleSearchFormProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
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

  /**
   * URL 동기화로 바뀐 값은 다시 검색하지 않고,
   * 사용자가 직접 입력한 변경만 debounce 검색으로 반영합니다.
   */
  React.useEffect(() => {
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
  }, [currentQuery, inputValue, replaceQuery]);

  /**
   * Enter 제출 시 debounce를 기다리지 않고 즉시 검색을 반영합니다.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (inputValue.trim() === currentQuery) return;

    skipDebounceRef.current = true;
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

    if (!currentQuery) return;

    skipDebounceRef.current = true;
    replaceQuery('');
  };

  return (
    <form aria-busy={isPending} css={formStyle} onSubmit={handleSubmit} role="search">
      <div css={searchRowStyle}>
        <div css={inputWrapStyle}>
          <Input
            aria-label={placeholder}
            autoComplete="off"
            css={[inputPaddingStyle, isPending ? pendingInputStyle : undefined]}
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
              css={clearButtonStyle}
              onClick={handleClear}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
        <Button disabled={isPending} type="submit" tone="black">
          {submitText}
        </Button>
      </div>
      {isPending ? (
        <p aria-live="polite" css={srOnlyStyle} role="status">
          {pendingText}
        </p>
      ) : null}
    </form>
  );
};

const formStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const searchRowStyle = css`
  display: grid;
  gap: var(--space-3);

  @media (min-width: 961px) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
`;

const inputWrapStyle = css`
  position: relative;
`;

const inputPaddingStyle = css`
  padding-right: 3.5rem;
`;

const clearButtonStyle = css`
  ${getButtonStyle({
    tone: 'white',
    variant: 'ghost',
  })};
  line-height: 1;
  position: absolute;
  top: 50%;
  right: var(--space-2);
  min-width: 2rem;
  min-height: 2rem;
  padding: 0;
  transform: translateY(-50%);
  border-radius: 999px;
`;

const pendingInputStyle = css`
  opacity: 0.7;
`;
