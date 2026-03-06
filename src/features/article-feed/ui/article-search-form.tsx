'use client';

import { css } from '@emotion/react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';

type ArticleSearchFormProps = {
  clearText: string;
  placeholder: string;
  searchQuery: string;
  submitText: string;
};

/**
 * 아티클 목록 페이지의 서버 검색 폼입니다.
 */
export const ArticleSearchForm = ({
  clearText,
  placeholder,
  searchQuery,
  submitText,
}: ArticleSearchFormProps) => (
  <form css={formStyle} method="GET">
    <Input
      aria-label={placeholder}
      defaultValue={searchQuery}
      name="q"
      placeholder={placeholder}
      type="search"
    />
    <div css={actionsStyle}>
      <Button type="submit">{submitText}</Button>
      {searchQuery ? (
        <Button asChild tone="white" variant="ghost">
          <Link href="/articles">{clearText}</Link>
        </Button>
      ) : null}
    </div>
  </form>
);

const formStyle = css`
  display: grid;
  gap: var(--space-3);

  @media (min-width: 721px) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
`;

const actionsStyle = css`
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
`;
