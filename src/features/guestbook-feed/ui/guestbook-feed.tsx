'use client';

import { css, type Theme } from '@emotion/react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef } from 'react';

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
      <section css={stateWrapStyle}>
        <p css={stateTextStyle}>{t('loading')}</p>
      </section>
    );
  }

  if (errorMessage && items.length === 0) {
    return (
      <section css={stateWrapStyle}>
        <p css={stateTextStyle}>{t('loadError')}</p>
        <Button onClick={() => void onRetry()} tone="white" variant="ghost">
          {t('retry')}
        </Button>
      </section>
    );
  }

  return (
    <section css={sectionStyle}>
      {items.length > 0 ? (
        <div css={stackStyle}>
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
              reportLabel={t('report')}
              revealLabel={t('secretReveal')}
              revealSecretErrorLabel={t('secretVerifyFailed')}
              revealSecretPasswordLabel={t('passwordInput')}
              revealSecretRequiredLabel={t('requiredField')}
              revealSecretSubmitLabel={t('confirm')}
              revealSecretTitle={t('secretRevealTitle')}
              onRevealSecret={onRevealSecret}
              secretPlaceholder={t('secretPlaceholder')}
            />
          ))}
        </div>
      ) : (
        <p css={emptyStyle}>{t('emptyItems')}</p>
      )}

      <div aria-hidden ref={sentinelRef} css={sentinelStyle} />
      {isLoadingMore ? <p css={loadingMoreStyle}>{t('loading')}</p> : null}
      {!hasMore ? (
        <p aria-live="polite" className={srOnlyClass}>
          {t('loadMoreEnd')}
        </p>
      ) : null}
      {errorMessage && items.length > 0 ? <p css={errorStyle}>{t('loadError')}</p> : null}
    </section>
  );
};

const sectionStyle = css`
  width: 100%;
  display: grid;
  gap: var(--space-3);
`;

const stackStyle = css`
  display: grid;
  gap: var(--space-8);
`;

const emptyStyle = css`
  color: rgb(var(--color-muted));
  padding: var(--space-4) var(--space-1);
`;

const sentinelStyle = css`
  width: 100%;
  height: 1px;
`;

const loadingMoreStyle = (_theme: Theme) => css`
  color: rgb(var(--color-muted));
  text-align: center;
  padding-bottom: 0.5rem;
`;

const errorStyle = css`
  color: rgb(var(--color-danger));
  text-align: center;
`;

const stateWrapStyle = css`
  width: 100%;
  min-height: 38vh;
  display: grid;
  place-items: center;
  gap: var(--space-3);
`;

const stateTextStyle = css`
  color: rgb(var(--color-muted));
`;
