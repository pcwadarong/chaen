'use client';

import { useTranslations } from 'next-intl';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';
import { GuestbookBoard } from '@/widgets/guestbook';

export type GuestPageProps = {
  initialCursor: string | null;
  initialItems: GuestbookThreadItem[];
};

/** 방명록 페이지 컨테이너입니다. */
export const GuestPage = ({ initialCursor, initialItems }: GuestPageProps) => {
  const t = useTranslations('Guest');

  return (
    <PageShell width="compact">
      <PageHeader title={t('title')} />
      <PageSection>
        <GuestbookBoard initialCursor={initialCursor} initialItems={initialItems} />
      </PageSection>
    </PageShell>
  );
};
