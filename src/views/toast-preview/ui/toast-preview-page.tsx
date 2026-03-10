'use client';

import React from 'react';

import { PageHeader, PageSection, PageShell } from '@/shared/ui/page-shell/page-shell';
import { type ToastItem, ToastViewport } from '@/shared/ui/toast/toast';

const previewItems: ToastItem[] = [
  {
    id: 'preview-success',
    message: 'Success toast message',
    description: 'Success toast message appear here',
    tone: 'success',
  },
  {
    id: 'preview-info',
    message: 'Info toast message',
    description: 'Info toast message appear here',
    tone: 'info',
  },
  {
    id: 'preview-error',
    message: 'Error toast message',
    description: 'Error toast message appear here',
    tone: 'error',
  },
];

/**
 * 토스트 컴포넌트를 수동 확인하기 위한 임시 프리뷰 페이지입니다.
 */
export const ToastPreviewPage = () => (
  <PageShell width="compact">
    <PageHeader
      description="참조 시안에 맞춘 토스트 레이아웃을 확인하는 임시 페이지입니다."
      title="Toast Preview"
    />
    <PageSection title="상태별 샘플">
      <p>하단 고정 위치에서 success, info, error 토스트를 동시에 확인할 수 있습니다.</p>
    </PageSection>
    <ToastViewport items={previewItems} />
  </PageShell>
);
