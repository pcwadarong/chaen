'use client';

import React from 'react';

import { useAuth } from '@/shared/providers';
import { DetailMetaBar, type DetailMetaBarProps } from '@/widgets/detail-page/ui/detail-meta-bar';

/**
 * 관리자 세션에서는 조회수 증가 요청을 보내지 않도록 감싼 아티클 상세 메타바입니다.
 */
export const ArticleDetailMetaBar = (props: DetailMetaBarProps) => {
  const { isAdmin } = useAuth();

  return (
    <DetailMetaBar
      {...props}
      trackViewAction={isAdmin ? undefined : props.trackViewAction}
      trackViewStorageKey={isAdmin ? undefined : props.trackViewStorageKey}
    />
  );
};
