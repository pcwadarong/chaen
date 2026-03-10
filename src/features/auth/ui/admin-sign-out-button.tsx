'use client';

import { css } from '@emotion/react';
import React, { useActionState } from 'react';

import { initialSignOutAdminState, signOutAdmin } from '@/features/auth/api/sign-out-admin';
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
    <form action={formAction} css={wrapperStyle}>
      <input name="redirectPath" type="hidden" value={redirectPath} />
      <Button disabled={isPending} tone="black" type="submit">
        {isPending ? submitPendingLabel : submitLabel}
      </Button>
      {state.errorMessage ? (
        <p aria-live="polite" css={messageStyle} role="alert">
          {state.errorMessage}
        </p>
      ) : null}
    </form>
  );
};

const wrapperStyle = css`
  display: grid;
  gap: var(--space-2);
`;

const messageStyle = css`
  margin: 0;
  color: rgb(190 24 93);
  font-size: var(--font-size-14);
`;
