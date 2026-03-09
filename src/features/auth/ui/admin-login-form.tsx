'use client';

import React, { startTransition, useState, useTransition } from 'react';
import { css } from 'styled-system/css';

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
    <main className={pageClass}>
      <form aria-busy={isPending} className={formClass} onSubmit={handleSubmit}>
        <h1 className={titleClass}>관리자 로그인</h1>
        <label className={fieldClass}>
          <span className={labelClass}>이메일</span>
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

        <label className={fieldClass}>
          <span className={labelClass}>비밀번호</span>
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
          <p aria-live="polite" className={errorClass} role="alert">
            {errorMessage}
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
  fontSize: '24',
  lineHeight: '120',
});

const fieldClass = css({
  display: 'grid',
  gap: '2',
});

const labelClass = css({
  fontSize: '14',
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
  fontSize: '14',
});
