'use client';

import { useTranslations } from 'next-intl';
import { type CSSProperties, useEffect, useRef } from 'react';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookThreadCard } from '@/entities/guestbook/ui/guestbook-thread-card';
import { formatYearMonthDay } from '@/shared/lib/date/format-year-month-day';

type GuestbookFeedProps = {
  canReply: boolean;
  errorMessage: string | null;
  hasMore: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  items: GuestbookThreadItem[];
  onDeleteReply: (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => void;
  onDelete: (entry: GuestbookThreadItem) => void;
  onEditReply: (entry: GuestbookEntry, parentEntry: GuestbookThreadItem) => void;
  onEdit: (entry: GuestbookThreadItem) => void;
  onLoadMore: () => Promise<void>;
  onReply: (entry: GuestbookThreadItem) => void;
  onRetry: () => Promise<void>;
  onRevealSecret: (entry: GuestbookThreadItem, password: string) => Promise<void>;
};

/**
 * 방명록 스레드 목록을 렌더링하고 무한스크롤을 처리합니다.
 */
export const GuestbookFeed = ({
  canReply,
  errorMessage,
  hasMore,
  isInitialLoading,
  isLoadingMore,
  items,
  onDeleteReply,
  onDelete,
  onEditReply,
  onEdit,
  onLoadMore,
  onReply,
  onRetry,
  onRevealSecret,
}: GuestbookFeedProps) => {
  const t = useTranslations('Guest');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const formatDateText = (isoDate: string) => formatYearMonthDay(isoDate) ?? '-';

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (!target?.isIntersecting) return;
        void onLoadMore();
      },
      {
        root: null,
        threshold: 0.25,
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [onLoadMore]);

  if (isInitialLoading) {
    return (
      <section style={stateWrapStyle}>
        <p style={stateTextStyle}>{t('loading')}</p>
      </section>
    );
  }

  if (errorMessage && items.length === 0) {
    return (
      <section style={stateWrapStyle}>
        <p style={stateTextStyle}>{t('loadError')}</p>
        <button onClick={() => void onRetry()} style={retryButtonStyle} type="button">
          {t('retry')}
        </button>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      {items.length > 0 ? (
        <div style={stackStyle}>
          {items.map(entry => (
            <GuestbookThreadCard
              actionDeleteLabel={t('delete')}
              actionEditLabel={t('edit')}
              actionReplyLabel={t('reply')}
              canReply={canReply}
              dateText={formatDateText}
              entry={entry}
              key={entry.id}
              onDeleteReply={onDeleteReply}
              onDelete={onDelete}
              onEditReply={onEditReply}
              onEdit={onEdit}
              onReply={onReply}
              revealLabel={t('secretReveal')}
              revealSecretErrorLabel={t('secretVerifyFailed')}
              revealSecretPasswordLabel={t('password')}
              revealSecretSubmitLabel={t('secretReveal')}
              revealSecretTitle={t('secretRevealTitle')}
              onRevealSecret={onRevealSecret}
              secretLabel={t('secretLabel')}
              secretPlaceholder={t('secretPlaceholder')}
            />
          ))}
        </div>
      ) : (
        <p style={emptyStyle}>{t('emptyItems')}</p>
      )}

      <div aria-hidden ref={sentinelRef} style={sentinelStyle} />
      {isLoadingMore ? <p style={loadingMoreStyle}>{t('loading')}</p> : null}
      {!hasMore ? <p style={endStyle}>{t('loadMoreEnd')}</p> : null}
      {errorMessage && items.length > 0 ? <p style={errorStyle}>{t('loadError')}</p> : null}
    </section>
  );
};

const sectionStyle: CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: '0.8rem',
};

const stackStyle: CSSProperties = {
  display: 'grid',
  gap: '0.9rem',
};

const emptyStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  padding: '1rem 0.25rem',
};

const sentinelStyle: CSSProperties = {
  width: '100%',
  height: '1px',
};

const loadingMoreStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  textAlign: 'center',
  paddingBottom: '0.5rem',
};

const endStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
  textAlign: 'center',
  paddingBottom: '0.5rem',
  fontSize: '0.9rem',
};

const errorStyle: CSSProperties = {
  color: 'rgb(var(--color-danger, 210 75 75))',
  textAlign: 'center',
};

const stateWrapStyle: CSSProperties = {
  width: '100%',
  minHeight: '38vh',
  display: 'grid',
  placeItems: 'center',
  gap: '0.75rem',
};

const stateTextStyle: CSSProperties = {
  color: 'rgb(var(--color-muted))',
};

const retryButtonStyle: CSSProperties = {
  minHeight: '2.4rem',
  padding: '0 1rem',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(var(--color-border) / 0.35)',
  backgroundColor: 'transparent',
  color: 'rgb(var(--color-text))',
};
