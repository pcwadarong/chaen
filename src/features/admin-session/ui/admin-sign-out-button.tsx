'use client';

import React, { useActionState } from 'react';
import { css } from 'styled-system/css';

import { signOutAdmin } from '@/features/admin-session/api/sign-out-admin';
import { initialSignOutAdminState } from '@/features/admin-session/api/sign-out-admin.state';
import { Button } from '@/shared/ui/button/button';

type AdminSignOutButtonProps = {
  redirectPath: string;
};

/**
 * 관리자 세션 종료 버튼입니다.
 */
export const AdminSignOutButton = ({ redirectPath }: AdminSignOutButtonProps) => {
  const [state, formAction, isPending] = useActionState(signOutAdmin, initialSignOutAdminState);

  return (
    <form action={formAction}>
      <input name="redirectPath" type="hidden" value={redirectPath} />
      <Button
        className={signOutButtonClass}
        disabled={isPending}
        tone="black"
        type="submit"
        variant="underline"
      >
        {isPending ? '로그아웃 중' : '로그아웃'}
      </Button>
      {state.errorMessage ? (
        <p aria-live="polite" className={messageClass} role="alert">
          {state.errorMessage}
        </p>
      ) : null}
    </form>
  );
};

const messageClass = css({
  color: 'error',
  fontSize: 'sm',
});

const errorInteractiveState = {
  color: 'error',
} as const;

const signOutButtonClass = css({
  color: 'error',
  _hover: errorInteractiveState,
  _focusVisible: errorInteractiveState,
});
