'use client';

import { css } from '@emotion/react';
import React, { useActionState } from 'react';

import { initialSignInAdminState, signInAdmin } from '@/features/auth/api/sign-in-admin';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';

type AdminLoginFormProps = {
  successRedirectPath: string;
};

/**
 * 관리자 이메일/비밀번호 로그인을 처리하는 클라이언트 폼입니다.
 */
export const AdminLoginForm = ({ successRedirectPath }: AdminLoginFormProps) => {
  const [state, formAction, isPending] = useActionState(signInAdmin, initialSignInAdminState);

  return (
    <main css={pageStyle}>
      <form action={formAction} aria-busy={isPending} css={formStyle}>
        <h1 css={titleStyle}>관리자 로그인</h1>
        <input name="redirectPath" type="hidden" value={successRedirectPath} />
        <label css={fieldStyle}>
          <span css={labelStyle}>이메일</span>
          <Input
            autoComplete="email"
            disabled={isPending}
            name="email"
            placeholder="admin@example.com"
            required
            type="email"
          />
        </label>

        <label css={fieldStyle}>
          <span css={labelStyle}>비밀번호</span>
          <Input
            autoComplete="current-password"
            disabled={isPending}
            name="password"
            placeholder="비밀번호"
            required
            type="password"
          />
        </label>

        {state.errorMessage ? (
          <p aria-live="polite" css={errorStyle} role="alert">
            {state.errorMessage}
          </p>
        ) : null}

        <div css={buttonRowStyle}>
          <Button disabled={isPending} tone="black" type="submit">
            {isPending ? '로그인 중' : '로그인'}
          </Button>
        </div>
      </form>
    </main>
  );
};

const pageStyle = css`
  width: 100%;
  padding: var(--space-8) var(--space-4);
`;

const formStyle = css`
  width: min(100%, 24rem);
  display: grid;
  gap: var(--space-4);
  margin: 0 auto;
`;

const titleStyle = css`
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-24);
  line-height: 1.2;
`;

const fieldStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const labelStyle = css`
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
`;

const buttonRowStyle = css`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const errorStyle = css`
  margin: 0;
  color: rgb(190 24 93);
  font-size: var(--font-size-14);
`;
