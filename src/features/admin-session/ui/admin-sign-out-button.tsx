'use client';

import React, { useActionState } from 'react';
import { css } from 'styled-system/css';

import { signOutAdmin } from '@/features/admin-session/api/sign-out-admin';
import { initialSignOutAdminState } from '@/features/admin-session/api/sign-out-admin.state';
import { Button } from '@/shared/ui/button/button';

type AdminSignOutButtonProps = {
  redirectPath: string;
  submitLabel: string;
  submitPendingLabel: string;
};

/**
 * 관리자 세션 종료 버튼입니다.
 */
export const AdminSignOutButton = ({
  redirectPath,
  submitLabel,
  submitPendingLabel,
}: AdminSignOutButtonProps) => {
  const [state, formAction, isPending] = useActionState(signOutAdmin, initialSignOutAdminState);

  return (
    <form action={formAction} className={wrapperClass}>
      <input name="redirectPath" type="hidden" value={redirectPath} />
      <Button disabled={isPending} tone="black" type="submit" variant="ghost">
        {isPending ? submitPendingLabel : submitLabel}
      </Button>
      {state.errorMessage ? (
        <p aria-live="polite" className={messageClass} role="alert">
          {state.errorMessage}
        </p>
      ) : null}
    </form>
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
