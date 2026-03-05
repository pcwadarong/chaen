'use client';

import { useTranslations } from 'next-intl';
import { type CSSProperties, useState } from 'react';

import type { GuestbookThreadItem } from '@/entities/guestbook/model/types';
import type { GuestbookComposeValues } from '@/features/guestbook-compose/model/types';
import { GuestbookComposeForm } from '@/features/guestbook-compose/ui/guestbook-compose-form';
import { GuestbookFeed } from '@/features/guestbook-feed/ui/guestbook-feed';

/**
 * 방명록 목록과 하단 고정 작성폼을 조합하는 위젯입니다.
 */
export const GuestbookBoard = () => {
  const t = useTranslations('Guest');
  const [replyTarget, setReplyTarget] = useState<GuestbookThreadItem | null>(null);

  const handleSubmit = async (_values: GuestbookComposeValues) => {
    setReplyTarget(null);
  };

  return (
    <div style={boardStyle}>
      <section style={feedWrapStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>{t('title')}</h1>
        </header>
        <GuestbookFeed onReply={entry => setReplyTarget(entry)} />
      </section>

      <GuestbookComposeForm
        onSubmit={handleSubmit}
        onReplyTargetReset={() => setReplyTarget(null)}
        replyTargetContent={replyTarget?.content ?? null}
        replyTargetResetLabel={t('replyTargetResetLabel')}
        secretLabel={t('secretLabel')}
        submitLabel={t('submit')}
        textPlaceholder={t('composePlaceholder')}
      />
    </div>
  );
};

const boardStyle: CSSProperties = {
  width: '100%',
  minHeight: '100dvh',
  display: 'grid',
  gridTemplateRows: '1fr',
};

const feedWrapStyle: CSSProperties = {
  width: 'min(1120px, 100%)',
  justifySelf: 'center',
  padding: '1.5rem 1rem 18rem',
  display: 'grid',
  gap: '1rem',
};

const headerStyle: CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
};

const titleStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
  lineHeight: 1.02,
  letterSpacing: '-0.03em',
};
