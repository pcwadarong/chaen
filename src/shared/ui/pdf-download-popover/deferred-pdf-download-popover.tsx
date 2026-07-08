'use client';

import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type {
  PdfFileDownloadOption,
  PdfFileDownloadSource,
  PdfFileKind,
} from '@/entities/pdf-file/model/types';
import { pdf } from '@/shared/lib/query/query-keys';
import { PdfDownloadPopover } from '@/shared/ui/pdf-download-popover/pdf-download-popover';

const PDF_OPTIONS_STALE_TIME = 5 * 60_000;
const EMPTY_PDF_DOWNLOAD_OPTIONS: PdfFileDownloadOption[] = [];

type DeferredPdfDownloadPopoverProps = {
  className?: string;
  kind: PdfFileKind;
  label: string;
  source: PdfFileDownloadSource;
  unavailableLabel: string;
};

/**
 * 초기 문서 렌더는 즉시 진행하고, PDF availability 확인만 hydration 이후에 분리합니다.
 * 첫 응답 TTFB를 줄이기 위해 다운로드 옵션은 클라이언트에서 별도 API로 조회합니다.
 */
export const DeferredPdfDownloadPopover = ({
  className,
  kind,
  label,
  source,
  unavailableLabel,
}: DeferredPdfDownloadPopoverProps) => {
  const { data, isPending } = useQuery({
    queryFn: async ({ signal }) => {
      const searchParams = new URLSearchParams({
        source,
      });
      const response = await fetch(`/api/pdf/options/${kind}?${searchParams.toString()}`, {
        method: 'GET',
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load PDF options: ${response.status}`);
      }

      return (await response.json()) as PdfFileDownloadOption[];
    },
    queryKey: pdf.options(kind, source),
    staleTime: PDF_OPTIONS_STALE_TIME,
  });

  return (
    <PdfDownloadPopover
      className={className}
      label={label}
      options={data ?? EMPTY_PDF_DOWNLOAD_OPTIONS}
      pending={isPending}
      unavailableLabel={unavailableLabel}
    />
  );
};
