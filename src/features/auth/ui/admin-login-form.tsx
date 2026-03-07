'use client';

import { css } from '@emotion/react';
import React, { startTransition, useState, useTransition } from 'react';

import { signInAdmin } from '@/features/auth/api/sign-in-admin';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';
import { Input } from '@/shared/ui/input/input';

type AdminLoginFormProps = {
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  invalidCredentialsMessage: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitErrorMessage: string;
  submitLabel: string;
  submitPendingLabel: string;
  successRedirectPath: string;
  title: string;
};

/**
 * 관리자 이메일/비밀번호 로그인을 처리하는 클라이언트 폼입니다.
 */
export const AdminLoginForm = ({
  description,
  emailLabel,
  emailPlaceholder,
  invalidCredentialsMessage,
  passwordLabel,
  passwordPlaceholder,
  submitErrorMessage,
  submitLabel,
  submitPendingLabel,
  successRedirectPath,
  title,
}: AdminLoginFormProps) => {
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
          setErrorMessage(invalidCredentialsMessage);
          return;
        }

        setErrorMessage(submitErrorMessage);
      }
    });
  };

  return (
    <section css={sectionStyle} aria-labelledby="admin-login-title">
      <div css={cardStyle}>
        <header css={headerStyle}>
          <p css={eyebrowStyle}>Admin</p>
          <h1 css={titleStyle} id="admin-login-title">
            {title}
          </h1>
          <p css={descriptionStyle}>{description}</p>
        </header>

        <form aria-busy={isPending} css={formStyle} onSubmit={handleSubmit}>
          <label css={fieldStyle}>
            <span css={labelStyle}>{emailLabel}</span>
            <Input
              autoComplete="email"
              disabled={isPending}
              name="email"
              onChange={event => setEmail(event.target.value)}
              placeholder={emailPlaceholder}
              required
              type="email"
              value={email}
            />
          </label>

          <label css={fieldStyle}>
            <span css={labelStyle}>{passwordLabel}</span>
            <Input
              autoComplete="current-password"
              disabled={isPending}
              name="password"
              onChange={event => setPassword(event.target.value)}
              placeholder={passwordPlaceholder}
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

          <Button fullWidth disabled={isPending} tone="black" type="submit">
            {isPending ? submitPendingLabel : submitLabel}
          </Button>
        </form>
      </div>
    </section>
  );
};

const sectionStyle = css`
  min-height: calc(100vh - 12rem);
  display: grid;
  place-items: center;
  padding: clamp(2rem, 5vw, 4rem) var(--space-4);
  background:
    radial-gradient(circle at top left, rgb(var(--color-primary) / 0.16), transparent 34%),
    radial-gradient(circle at bottom right, rgb(var(--color-text) / 0.09), transparent 28%),
    linear-gradient(180deg, rgb(var(--color-surface-muted)), rgb(var(--color-bg)));
`;

const cardStyle = css`
  width: min(100%, 28rem);
  display: grid;
  gap: var(--space-6);
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid rgb(var(--color-border) / 0.18);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
  box-shadow:
    0 20px 48px rgb(15 23 42 / 0.08),
    inset 0 1px 0 rgb(255 255 255 / 0.45);
`;

const headerStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const eyebrowStyle = css`
  margin: 0;
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--color-primary));
`;

const titleStyle = css`
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  line-height: 1.1;
`;

const descriptionStyle = css`
  margin: 0;
  color: rgb(var(--color-muted));
  line-height: var(--line-height-155);
`;

const formStyle = css`
  display: grid;
  gap: var(--space-4);
`;

const fieldStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const labelStyle = css`
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
`;

const errorStyle = css`
  margin: 0;
  color: rgb(190 24 93);
  font-size: var(--font-size-14);
`;
