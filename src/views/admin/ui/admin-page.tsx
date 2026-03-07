import { css } from '@emotion/react';
import { useTranslations } from 'next-intl';

import { AdminSignOutButton } from '@/features/auth/ui/admin-sign-out-button';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button/button';

type AdminPageProps = {
  locale: string;
  userEmail: string | null;
};

/**
 * 현재 관리자 세션 상태를 확인하고 로그아웃할 수 있는 최소 관리자 페이지입니다.
 */
export const AdminPage = ({ locale, userEmail }: AdminPageProps) => {
  const t = useTranslations('Admin');

  return (
    <main css={pageStyle}>
      <section aria-labelledby="admin-page-title" css={panelStyle}>
        <p css={eyebrowStyle}>Admin</p>
        <h1 css={titleStyle} id="admin-page-title">
          {t('title')}
        </h1>
        <p css={descriptionStyle}>{t('description')}</p>
        <dl css={metaGridStyle}>
          <div css={metaItemStyle}>
            <dt css={metaLabelStyle}>{t('sessionLabel')}</dt>
            <dd css={metaValueStyle}>{t('sessionValue')}</dd>
          </div>
          <div css={metaItemStyle}>
            <dt css={metaLabelStyle}>{t('emailLabel')}</dt>
            <dd css={metaValueStyle}>{userEmail ?? t('emailFallback')}</dd>
          </div>
        </dl>
        <div css={actionRowStyle}>
          <Button asChild tone="white" type="button">
            <Link href="/guest">{t('guestbookLink')}</Link>
          </Button>
          <AdminSignOutButton
            errorMessage={t('signOutError')}
            redirectPath={`/${locale}/admin/login`}
            submitLabel={t('signOut')}
            submitPendingLabel={t('signOutPending')}
          />
        </div>
      </section>
    </main>
  );
};

const pageStyle = css`
  min-height: calc(100vh - 12rem);
  display: grid;
  place-items: center;
  padding: clamp(2rem, 5vw, 4rem) var(--space-4);
  background:
    radial-gradient(circle at top right, rgb(var(--color-primary) / 0.18), transparent 32%),
    linear-gradient(180deg, rgb(var(--color-bg)), rgb(var(--color-surface-muted)));
`;

const panelStyle = css`
  width: min(100%, 42rem);
  display: grid;
  gap: var(--space-5);
  padding: clamp(1.75rem, 4vw, 2.75rem);
  border: 1px solid rgb(var(--color-border) / 0.18);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgb(var(--color-surface)), rgb(var(--color-surface-muted))),
    rgb(var(--color-surface));
  box-shadow: 0 20px 48px rgb(15 23 42 / 0.08);
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
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.08;
`;

const descriptionStyle = css`
  margin: 0;
  color: rgb(var(--color-muted));
  line-height: var(--line-height-155);
`;

const metaGridStyle = css`
  display: grid;
  gap: var(--space-3);
`;

const metaItemStyle = css`
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-l);
  background: rgb(var(--color-bg) / 0.6);
`;

const metaLabelStyle = css`
  color: rgb(var(--color-muted));
  font-size: var(--font-size-13);
`;

const metaValueStyle = css`
  margin: 0;
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
`;

const actionRowStyle = css`
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  align-items: start;
`;
