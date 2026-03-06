'use client';

import { useTranslations } from 'next-intl';

import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';
import { GuestbookBoard } from '@/widgets/guestbook';

/** 방명록 페이지 컨테이너입니다. */
export const GuestPage = () => {
  const t = useTranslations('Guest');

  return (
    <PageShell>
      <PageHeader title={t('title')} />
      <PageSection>
        <GuestbookBoard />
      </PageSection>
    </PageShell>
  );
};
