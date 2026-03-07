'use client';

import { css } from '@emotion/react';
import React, { startTransition, useState, useTransition } from 'react';

import { signInAdmin } from '@/features/auth/api/sign-in-admin';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';

type AdminLoginFormProps = {
  successRedirectPath: string;
};

/**
 * 관리자 이메일/비밀번호 로그인을 처리하는 클라이언트 폼입니다.
 */
export const AdminLoginForm = ({ successRedirectPath }: AdminLoginFormProps) => {
  const router = useRouter();
  const [isPending, startSubmitTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 로그인 성공 시 현재 locale guest 페이지로 이동해 관리자 권한이 반영된 상태를 확인하게 합니다.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSubmitTransition(async () => {
      try {
        setErrorMessage(null);
        await signInAdmin({ email, password });
        startTransition(() => {
          router.replace(successRedirectPath);
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'invalid credentials') {
          setErrorMessage('이메일 또는 비밀번호를 다시 확인해주세요.');
          return;
        }

        setErrorMessage('로그인 처리 중 문제가 발생했습니다.');
      }
    });
  };

  return (
    <main css={pageStyle}>
      <form aria-busy={isPending} css={formStyle} onSubmit={handleSubmit}>
        <h1 css={titleStyle}>관리자 로그인</h1>
        <label css={fieldStyle}>
          <span css={labelStyle}>이메일</span>
          <Input
            autoComplete="email"
            disabled={isPending}
            name="email"
            onChange={event => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label css={fieldStyle}>
          <span css={labelStyle}>비밀번호</span>
          <Input
            autoComplete="current-password"
            disabled={isPending}
            name="password"
            onChange={event => setPassword(event.target.value)}
            placeholder="비밀번호"
            required
            type="password"
            value={password}
          />
        </label>

        {errorMessage ? (
          <p aria-live="polite" css={errorStyle} role="alert">
            {errorMessage}
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
