'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { HomeHeroImageViewerItem } from '@/widgets/home-hero-scene/model/home-hero-image-viewer-item';

const HOME_HERO_FRAME_IMAGE_STORAGE_KEY = 'home-hero:selected-frame-image-src';

type UseHomeHeroFrameSelectionParams = Readonly<{
  photoItems: HomeHeroImageViewerItem[];
}>;

type UseHomeHeroFrameSelectionResult = Readonly<{
  closeImageViewer: () => void;
  imageViewerOpenIndex: number | null;
  openImageViewer: () => void;
  selectFrameImageByIndex: (nextIndex: number) => void;
  selectedFrameImageIndex: number;
  selectedFrameImageSrc: string | null;
}>;

/**
 * 홈 히어로의 액자 이미지 선택 상태와 이미지 뷰어 열림 상태를 함께 관리합니다.
 *
 * 이 훅은 아래 책임을 한곳으로 모읍니다.
 * - storage photo 목록의 첫 이미지를 기본 액자 이미지로 선택
 * - `localStorage`에 마지막으로 고른 액자 이미지를 복원/저장
 * - 이미지 뷰어를 현재 액자 인덱스 기준으로 열고 닫기
 * - 뷰어에서 선택한 이미지를 액자 이미지로 반영
 *
 * `photoItems`가 비어 있을 수 있으므로, 모든 선택 로직은 "없으면 null 유지"를 기본값으로 삼습니다.
 * 또한 storage 접근이 막힌 브라우저에서는 예외를 삼키고 메모리 상태만 유지합니다.
 *
 * @param params 홈 히어로에서 사용할 이미지 목록
 * @returns 액자 이미지 선택 상태, 현재 뷰어 인덱스, 뷰어 열기/닫기/선택 핸들러
 */
export const useHomeHeroFrameSelection = ({
  photoItems,
}: UseHomeHeroFrameSelectionParams): UseHomeHeroFrameSelectionResult => {
  const defaultFrameImageSrc = photoItems[0]?.src ?? null;
  const [imageViewerOpenIndex, setImageViewerOpenIndex] = useState<number | null>(null);
  const [selectedFrameImageSrc, setSelectedFrameImageSrc] = useState<string | null>(
    defaultFrameImageSrc,
  );
  const selectedFrameImageSrcRef = useRef<string | null>(defaultFrameImageSrc);
  const selectedFrameImageIndex = useMemo(
    () => photoItems.findIndex(item => item.src === selectedFrameImageSrc),
    [photoItems, selectedFrameImageSrc],
  );

  useEffect(() => {
    selectedFrameImageSrcRef.current = selectedFrameImageSrc;
  }, [selectedFrameImageSrc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let storedImageSrc: string | null = null;

    try {
      storedImageSrc = window.localStorage.getItem(HOME_HERO_FRAME_IMAGE_STORAGE_KEY);
    } catch {
      return;
    }

    if (!storedImageSrc) return;
    if (!photoItems.some(item => item.src === storedImageSrc)) return;

    setSelectedFrameImageSrc(storedImageSrc);
  }, [photoItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedFrameImageSrc) return;

    try {
      window.localStorage.setItem(HOME_HERO_FRAME_IMAGE_STORAGE_KEY, selectedFrameImageSrc);
    } catch {
      // storage 접근이 막힌 환경에서는 기본 선택 상태만 유지합니다.
    }
  }, [selectedFrameImageSrc]);

  /**
   * 현재 액자에 적용된 이미지 인덱스를 기준으로 이미지 뷰어를 엽니다.
   * 일치하는 이미지가 없으면 첫 번째 이미지부터 시작합니다.
   */
  const openImageViewer = useCallback(() => {
    const nextIndex = photoItems.findIndex(item => item.src === selectedFrameImageSrcRef.current);

    setImageViewerOpenIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [photoItems]);

  /**
   * 이미지 뷰어를 닫고 열림 상태를 초기화합니다.
   */
  const closeImageViewer = useCallback(() => {
    setImageViewerOpenIndex(null);
  }, []);

  /**
   * 전달받은 인덱스의 이미지를 액자에 반영합니다.
   * 인덱스가 유효하지 않으면 기본 액자 이미지로 되돌립니다.
   *
   * @param nextIndex photoItems 배열 기준 인덱스
   */
  const selectFrameImageByIndex = useCallback(
    (nextIndex: number) => {
      const nextImageSrc = photoItems[nextIndex]?.src ?? defaultFrameImageSrc;
      selectedFrameImageSrcRef.current = nextImageSrc;
      setSelectedFrameImageSrc(nextImageSrc);
    },
    [defaultFrameImageSrc, photoItems],
  );

  return {
    closeImageViewer,
    imageViewerOpenIndex,
    openImageViewer,
    selectFrameImageByIndex,
    selectedFrameImageIndex,
    selectedFrameImageSrc,
  };
};
