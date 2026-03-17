import { useTranslations } from 'next-intl';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookBoard } from '@/widgets/guestbook';
import { PageHeader, PageSection, PageShell } from '@/widgets/page-shell/ui/page-shell';

export type GuestPageProps = {
  initialCursor: string | null;
  initialItems: GuestbookThreadItem[];
};

/** 방명록 페이지 컨테이너입니다. */
export const GuestPage = ({ initialCursor, initialItems }: GuestPageProps) => {
  const t = useTranslations('Guest');

  return (
    <PageShell width="compact">
      <PageHeader description={t('description')} title={t('title')} />
      <PageSection>
        <GuestbookBoard initialCursor={initialCursor} initialItems={initialItems} />
      </PageSection>
    </PageShell>
  );
};
