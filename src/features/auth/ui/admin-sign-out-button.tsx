'use client';

import React, { startTransition, useState, useTransition } from 'react';
import { css } from 'styled-system/css';

import { signOutAdmin } from '@/features/auth/api/sign-out-admin';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';

type AdminSignOutButtonProps = {
  errorMessage: string;
  redirectPath: string;
  submitLabel: string;
  submitPendingLabel: string;
};

/**
 * 관리자 세션 종료 버튼입니다.
 */
export const AdminSignOutButton = ({
  errorMessage,
  redirectPath,
  submitLabel,
  submitPendingLabel,
}: AdminSignOutButtonProps) => {
  const router = useRouter();
  const [isPending, startSubmitTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    startSubmitTransition(async () => {
      try {
        setMessage(null);
        await signOutAdmin();
        startTransition(() => {
          router.replace(redirectPath);
        });
      } catch {
        setMessage(errorMessage);
      }
    });
  };

  return (
    <div className={wrapperClass}>
      <Button disabled={isPending} onClick={handleClick} tone="black" type="button">
        {isPending ? submitPendingLabel : submitLabel}
      </Button>
      {message ? (
        <p aria-live="polite" className={messageClass} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
};

const wrapperClass = css({
  display: 'grid',
  gap: '2',
});

const messageClass = css({
  m: '0',
  color: '[rgb(190 24 93)]',
  fontSize: 'sm',
});
