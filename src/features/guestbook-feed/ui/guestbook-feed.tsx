'use client';

import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useRef } from 'react';
import { css } from 'styled-system/css';

import type { GuestbookEntry, GuestbookThreadItem } from '@/entities/guestbook/model/types';
import { GuestbookThreadCard } from '@/entities/guestbook/ui/guestbook-thread-card';
import { formatYearMonthDay } from '@/shared/lib/date/format-year-month-day';
import { Button } from '@/shared/ui/button/button';
import { srOnlyClass } from '@/shared/ui/styles/sr-only-style';

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
  onRevealSecretSuccess: (entry: GuestbookEntry) => void;
  onReply: (entry: GuestbookThreadItem) => void;
  onRetry: () => Promise<void>;
};

/**
 * 방명록 스레드 목록을 렌더링하고 무한스크롤을 처리합니다.
 */
const GuestbookFeedBase = ({
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
  onRevealSecretSuccess,
  onReply,
  onRetry,
}: GuestbookFeedProps) => {
  const t = useTranslations('Guest');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const formatDateText = useCallback((isoDate: string) => formatYearMonthDay(isoDate) ?? '-', []);
  const handleRetry = useCallback(() => {
    void onRetry();
  }, [onRetry]);

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
      <section className={stateWrapClass}>
        <p className={stateTextClass}>{t('loading')}</p>
      </section>
    );
  }

  if (errorMessage && items.length === 0) {
    return (
      <section className={stateWrapClass}>
        <p className={stateTextClass}>{t('loadError')}</p>
        <Button onClick={handleRetry} tone="white" variant="ghost">
          {t('retry')}
        </Button>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      {items.length > 0 ? (
        <div className={stackClass}>
          {items.map(entry => (
            <GuestbookThreadCard
              actionDeleteLabel={t('delete')}
              actionEditLabel={t('edit')}
              actionMenuLabel={t('actionMenuLabel')}
              actionMenuPanelLabel={t('actionMenuPanelLabel')}
              actionReplyLabel={t('reply')}
              canReply={canReply}
              dateText={formatDateText}
              deletedPlaceholder={t('deletedPlaceholder')}
              entry={entry}
              key={entry.id}
              onDeleteReply={onDeleteReply}
              onDelete={onDelete}
              onEditReply={onEditReply}
              onEdit={onEdit}
              onReply={onReply}
              onRevealSecretSuccess={onRevealSecretSuccess}
              reportLabel={t('report')}
              revealLabel={t('secretReveal')}
              revealSecretPasswordLabel={t('passwordInput')}
              revealSecretSubmitLabel={t('confirm')}
              revealSecretTitle={t('secretRevealTitle')}
              secretPlaceholder={t('secretPlaceholder')}
            />
          ))}
        </div>
      ) : (
        <p className={emptyClass}>{t('emptyItems')}</p>
      )}

      <div aria-hidden className={sentinelClass} ref={sentinelRef} />
      {isLoadingMore ? <p className={loadingMoreClass}>{t('loading')}</p> : null}
      {!hasMore ? (
        <p aria-live="polite" className={srOnlyClass}>
          {t('loadMoreEnd')}
        </p>
      ) : null}
      {errorMessage && items.length > 0 ? <p className={errorClass}>{t('loadError')}</p> : null}
    </section>
  );
};

GuestbookFeedBase.displayName = 'GuestbookFeed';

export const GuestbookFeed = React.memo(GuestbookFeedBase);

const sectionClass = css({
  width: 'full',
  display: 'grid',
  gap: '3',
});

const stackClass = css({
  display: 'grid',
  gap: '8',
});

const emptyClass = css({
  color: 'muted',
  px: '1',
  py: '4',
});

const sentinelClass = css({
  width: 'full',
  height: '[1px]',
});

const loadingMoreClass = css({
  color: 'muted',
  textAlign: 'center',
  pb: '2',
});

const errorClass = css({
  color: 'error',
  textAlign: 'center',
});

const stateWrapClass = css({
  width: 'full',
  minHeight: '[38vh]',
  display: 'grid',
  placeItems: 'center',
  gap: '3',
});

const stateTextClass = css({
  color: 'muted',
});
