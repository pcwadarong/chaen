'use client';

import React, { useActionState } from 'react';
import { css } from 'styled-system/css';

import { signInAdmin } from '@/features/admin-session/api/sign-in-admin';
import { initialSignInAdminState } from '@/features/admin-session/api/sign-in-admin.state';
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
    <main className={pageClass}>
      <form action={formAction} aria-busy={isPending} className={formClass}>
        <h1 className={titleClass}>관리자 로그인</h1>
        <input name="redirectPath" type="hidden" value={successRedirectPath} />
        <label className={fieldClass}>
          <span className={labelClass}>이메일</span>
          <Input
            autoComplete="email"
            disabled={isPending}
            name="email"
            placeholder="admin@example.com"
            required
            type="email"
          />
        </label>

        <label className={fieldClass}>
          <span className={labelClass}>비밀번호</span>
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
          <p aria-live="polite" className={errorClass} role="alert">
            {state.errorMessage}
          </p>
        ) : null}

        <div className={buttonRowClass}>
          <Button disabled={isPending} tone="black" type="submit">
            {isPending ? '로그인 중' : '로그인'}
          </Button>
        </div>
      </form>
    </main>
  );
};

const pageClass = css({
  width: 'full',
  px: '4',
  py: '8',
});

const formClass = css({
  width: '[min(100%, 24rem)]',
  display: 'grid',
  gap: '4',
  mx: 'auto',
});

const titleClass = css({
  mb: '2',
  mt: '0',
  fontSize: '2xl',
  lineHeight: 'tight',
});

const fieldClass = css({
  display: 'grid',
  gap: '2',
});

const labelClass = css({
  fontSize: 'sm',
  fontWeight: 'medium',
});

const buttonRowClass = css({
  display: 'flex',
  gap: '2',
  flexWrap: 'wrap',
});

const errorClass = css({
  m: '0',
  color: '[rgb(190 24 93)]',
  fontSize: 'sm',
});
