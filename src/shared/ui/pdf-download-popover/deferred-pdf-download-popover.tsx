'use client';

import React from 'react';

import type {
  PdfFileDownloadOption,
  PdfFileDownloadSource,
  PdfFileKind,
} from '@/entities/pdf-file/model/types';
import { PdfDownloadPopover } from '@/shared/ui/pdf-download-popover/pdf-download-popover';

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
  const [options, setOptions] = React.useState<PdfFileDownloadOption[]>([]);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');

  React.useEffect(() => {
    const abortController = new AbortController();

    const loadOptions = async () => {
      setStatus('loading');

      try {
        const searchParams = new URLSearchParams({
          source,
        });
        const response = await fetch(`/api/pdf/options/${kind}?${searchParams.toString()}`, {
          method: 'GET',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF options: ${response.status}`);
        }

        const data = (await response.json()) as PdfFileDownloadOption[];
        setOptions(data);
        setStatus('ready');
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error('[pdf] deferred download options failed', {
          error,
          kind,
          source,
        });
        setOptions([]);
        setStatus('error');
      }
    };

    void loadOptions();

    return () => {
      abortController.abort();
    };
  }, [kind, source]);

  return (
    <PdfDownloadPopover
      className={className}
      label={label}
      options={options}
      pending={status === 'loading'}
      unavailableLabel={unavailableLabel}
    />
  );
};
