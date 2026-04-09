'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActionResult } from '@/shared/lib/action/action-result';
import { getErrorMessage } from '@/shared/lib/error/get-error-message';
import {
  type DetailArchivePage,
  type DetailArchiveRecord,
  mergeCurrentArchiveItemIntoDetailArchivePage,
} from '@/widgets/detail-page/archive/model/detail-archive-feed';

const DETAIL_ARCHIVE_LOAD_ERROR_CODE = 'detailArchive.loadFailed';
const DETAIL_ARCHIVE_DEFAULT_LIMIT = 10;

type UseDetailArchiveBootstrapPageOptions<TItem extends DetailArchiveRecord> = Readonly<{
  currentItem?: TItem | null;
  initialPage?: DetailArchivePage<TItem> | null;
  loadPageAction: (input: {
    cursor?: string | null;
    limit: number;
    locale: string;
  }) => Promise<ActionResult<DetailArchivePage<TItem>>>;
  locale: string;
  pinCurrentItemToTop: boolean;
}>;

type UseDetailArchiveBootstrapPageResult<TItem extends DetailArchiveRecord> = Readonly<{
  bootstrapError: string | null;
  bootstrapPage: DetailArchivePage<TItem> | null;
  isBootstrapping: boolean;
  retryBootstrap: () => void;
}>;

/**
 * 상세 아카이브의 첫 페이지 확보와 재시도 상태를 관리합니다.
 * SSR seed가 있으면 현재 항목 병합만 수행하고, 없으면 첫 페이지를 가져와 같은 규칙으로 정규화합니다.
 */
export const useDetailArchiveBootstrapPage = <TItem extends DetailArchiveRecord>({
  currentItem = null,
  initialPage = null,
  loadPageAction,
  locale,
  pinCurrentItemToTop,
}: UseDetailArchiveBootstrapPageOptions<TItem>): UseDetailArchiveBootstrapPageResult<TItem> => {
  const mergedInitialPage = useMemo(
    () =>
      mergeCurrentArchiveItemIntoDetailArchivePage(initialPage, currentItem, pinCurrentItemToTop),
    [currentItem, initialPage, pinCurrentItemToTop],
  );
  const [fetchedBootstrapPage, setFetchedBootstrapPage] = useState<DetailArchivePage<TItem> | null>(
    () => null,
  );
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(initialPage === null);
  const [bootstrapRequestKey, setBootstrapRequestKey] = useState(0);
  const bootstrapPage = mergedInitialPage ?? fetchedBootstrapPage;

  useEffect(() => {
    if (!initialPage) return;

    setBootstrapError(null);
    setIsBootstrapping(false);
  }, [initialPage]);

  useEffect(() => {
    if (initialPage) return;

    let isMounted = true;

    const bootstrapArchivePage = async () => {
      setIsBootstrapping(true);
      setBootstrapError(null);

      try {
        const result = await loadPageAction({
          cursor: null,
          limit: DETAIL_ARCHIVE_DEFAULT_LIMIT,
          locale,
        });

        if (!result.ok || !result.data) {
          throw new Error(
            result.errorCode ?? result.errorMessage ?? DETAIL_ARCHIVE_LOAD_ERROR_CODE,
          );
        }

        if (!isMounted) return;

        setFetchedBootstrapPage(
          mergeCurrentArchiveItemIntoDetailArchivePage(
            {
              items: result.data.items,
              nextCursor: result.data.nextCursor,
            },
            currentItem,
            pinCurrentItemToTop,
          ),
        );
      } catch (error) {
        if (!isMounted) return;

        setBootstrapError(getErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrapArchivePage();

    return () => {
      isMounted = false;
    };
  }, [bootstrapRequestKey, currentItem, initialPage, loadPageAction, locale, pinCurrentItemToTop]);

  const retryBootstrap = useCallback(() => {
    setBootstrapRequestKey(previous => previous + 1);
  }, []);

  return {
    bootstrapError,
    bootstrapPage,
    isBootstrapping,
    retryBootstrap,
  };
};
