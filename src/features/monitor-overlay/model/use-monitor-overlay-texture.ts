'use client';

import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

import type { ProjectListItem } from '@/entities/project/model/types';
import {
  getMonitorOverlayScreenData,
  type MonitorOverlayProjectCard,
  type MonitorOverlayScreenData,
} from '@/features/monitor-overlay/model/get-monitor-overlay-screen-data';

type UseMonitorOverlayTextureParams = Readonly<{
  items: ProjectListItem[];
  locale: string;
  ongoingLabel: string;
}>;

// monitor texture 원본 캔버스 가로 해상도. 키우면 더 선명하지만 매 프레임 갱신 비용이 커진다.
const MONITOR_TEXTURE_WIDTH = 1280;

// monitor texture 원본 캔버스 세로 해상도. 액정 비율과 함께 맞춰야 왜곡이 줄어든다.
const MONITOR_TEXTURE_HEIGHT = 580;

// 모델 UV 방향에 맞추기 위한 텍스처 회전값. 현재는 시계 반대 방향 90도 회전이 정방향이다.
const MONITOR_TEXTURE_ROTATION = Math.PI / 2;

// 라이트 테마용 monitor palette. 실제 페이지 카드보다 살짝 단순화한 zinc 계열을 사용한다.
const LIGHT_COLOR = {
  background: '#ffffff',
  border: '#d4d4d8', // zinc.300
  cardSurface: '#f4f4f5', // zinc.100  (surfaceMuted)
  muted: '#71717a', // zinc.500
  text: '#18181b', // zinc.900
  thumbnailBg: '#e4e4e7', // zinc.200  (surfaceStrong)
} as const;

// 다크 테마용 monitor palette. 밝은 card 위주 구조는 유지하되, 화면 전체 명도만 앱 테마에 맞춘다.
const DARK_COLOR = {
  background: '#09090b', // zinc.950
  border: '#3f3f46', // zinc.700
  cardSurface: '#18181b', // zinc.900
  muted: '#a1a1aa', // zinc.400
  text: '#fafafa', // zinc.50
  thumbnailBg: '#27272a', // zinc.800
} as const;

type MonitorOverlayColorPalette = typeof LIGHT_COLOR | typeof DARK_COLOR;

// 스크린 left edge ≈ canvas X=380 (이미지 실측 기준)
// 안전 영역: X=400~1220, Y=120~680

// 카드 시작 X 위치. 모니터 왼쪽 베젤 안으로 들어오지 않게 여유를 둔다.
const CONTENT_X = 368;

// 카드 3장이 실제 screen 안에 들어오는 전체 가용 폭.
const CONTENT_WIDTH = 896; // X=400 ~ X=1220

// 카드 사이 가로 간격. 줄이면 더 빽빽해지고, 늘리면 액정 안 여백이 커진다.
const CARD_GAP = 16;

// 현재 monitor 안에 고정으로 배치할 카드 수.
const CARD_COUNT = 3;

// 카드 1장 폭. CARD_COUNT / CARD_GAP / CONTENT_WIDTH를 함께 조절하면 바뀐다.
const CARD_WIDTH = Math.floor((CONTENT_WIDTH - CARD_GAP * (CARD_COUNT - 1)) / CARD_COUNT); // 260

// 카드 상단 Y 위치. 위로 올리면 베젤에 붙고, 내리면 하단 여백이 줄어든다.
const CARD_Y = 133;

// 카드 전체 높이. 이번 조정에서 카드 높이를 조금 줄여 액정 안 답답함을 덜었다.
const CARD_HEIGHT = 304;

// 카드 라운드 반경. 너무 크면 장난감처럼 보이고, 너무 작으면 카드 느낌이 약해진다.
const CARD_RADIUS = 22;

// 썸네일 높이. 이번 조정에서 더 크게 잡아 첫 인상이 이미지 중심으로 보이게 했다.
const THUMBNAIL_HEIGHT = 160;

// 카드 내부 좌우/상하 패딩. 줄이면 텍스트가 꽉 차고, 늘리면 더 고급스럽게 보인다.
const CONTENT_PAD = 19;

// period 라인의 첫 baseline 위치.
const PERIOD_Y_OFFSET = 16;

// title 블록 시작 위치. 위로 당기면 정보 밀도가 높아지고, 내리면 여유가 생긴다.
const TITLE_Y_OFFSET = 48;

// description 블록 시작 위치. 현재는 썸네일을 키운 대신 본문 높이를 줄여 2줄 중심으로 정리했다.
const DESCRIPTION_Y_OFFSET = 76;

// description 최대 줄 수. 카드 높이를 줄인 상태에서 읽힘을 유지하기 위해 2줄로 제한한다.
const DESCRIPTION_MAX_LINES = 2;

// period 메타 텍스트 크기. 너무 커지면 날짜 정보가 먼저 튀고, 너무 작으면 읽기 어려워진다.
const PERIOD_FONT = '200 12px sans-serif';

// title 텍스트 크기. 카드의 대표 위계를 결정하는 핵심 수치다.
const TITLE_FONT = '300 16px sans-serif';

// title 줄간격. 줄이면 덩어리감이 생기고, 늘리면 조금 더 에디토리얼하게 보인다.
const TITLE_LINE_HEIGHT = 24;

// description 텍스트 크기. 카드 정보량과 가독성 균형을 맞추는 수치다.
const DESCRIPTION_FONT = '200 12px sans-serif';

// description 줄간격. 카드 높이를 줄인 상태라 현재는 다소 타이트하게 유지한다.
const DESCRIPTION_LINE_HEIGHT = 22;

/**
 * 노트북 화면에 붙일 CanvasTexture를 생성합니다.
 * 흰 배경 위에 ContentCard 디자인(zinc 팔레트, 썸네일 + period + title + description)을
 * 3개 가로 나열합니다.
 */
export const useMonitorOverlayTexture = ({
  items,
  locale,
  ongoingLabel,
}: UseMonitorOverlayTextureParams): Texture | null => {
  const { resolvedTheme } = useTheme();
  const screenData = useMemo(
    () => getMonitorOverlayScreenData({ items, locale, ongoingLabel }),
    [items, locale, ongoingLabel],
  );
  const colorPalette = useMemo<MonitorOverlayColorPalette>(
    () => (resolvedTheme === 'dark' ? DARK_COLOR : LIGHT_COLOR),
    [resolvedTheme],
  );

  // 썸네일 이미지 로드: 3개 모두 별도 관리
  const thumbnailImagesRef = useRef<(HTMLImageElement | null)[]>([null, null, null]);

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = MONITOR_TEXTURE_WIDTH;
    canvas.height = MONITOR_TEXTURE_HEIGHT;

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.center.set(0.5, 0.5);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.flipY = false;
    nextTexture.rotation = MONITOR_TEXTURE_ROTATION;
    nextTexture.needsUpdate = true;

    return nextTexture;
  }, []);

  // screenData가 바뀔 때마다 썸네일을 다시 로드하고 texture를 갱신
  useEffect(() => {
    if (!texture || typeof window === 'undefined') return;

    thumbnailImagesRef.current = [null, null, null];

    const redraw = () => {
      const canvas = texture.image as HTMLCanvasElement;
      const context = canvas.getContext('2d');

      if (!context) return;

      drawMonitorOverlayTexture(context, screenData, thumbnailImagesRef.current, colorPalette);
      texture.needsUpdate = true;
    };

    redraw();

    const cleanupFns: (() => void)[] = [];

    screenData.projects.forEach((project, i) => {
      if (!project.thumbnailSrc) return;

      let isActive = true;
      const image = new window.Image();

      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (!isActive) return;

        thumbnailImagesRef.current[i] = image;
        redraw();
      };
      image.src = project.thumbnailSrc;

      cleanupFns.push(() => {
        isActive = false;
      });
    });

    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, [colorPalette, screenData, texture]);

  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );

  return texture;
};

/**
 * 흰 배경에 ContentCard 스타일 프로젝트 카드 3개를 가로 나열합니다.
 */
const drawMonitorOverlayTexture = (
  context: CanvasRenderingContext2D,
  screenData: MonitorOverlayScreenData,
  thumbnailImages: (HTMLImageElement | null)[],
  colorPalette: MonitorOverlayColorPalette,
) => {
  const { canvas } = context;

  context.fillStyle = colorPalette.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  screenData.projects.forEach((project, i) => {
    const cardX = CONTENT_X + i * (CARD_WIDTH + CARD_GAP);

    drawContentCard(
      context,
      project,
      thumbnailImages[i] ?? null,
      colorPalette,
      cardX,
      CARD_Y,
      CARD_WIDTH,
      CARD_HEIGHT,
    );
  });
};

/**
 * ContentCard(썸네일 영역 + period + title + description)를 캔버스에 그립니다.
 * zinc 팔레트 light 테마를 기준으로 합니다.
 */
const drawContentCard = (
  context: CanvasRenderingContext2D,
  project: MonitorOverlayProjectCard,
  image: HTMLImageElement | null,
  colorPalette: MonitorOverlayColorPalette,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  // 카드 배경
  fillRoundedRect(context, x, y, width, height, CARD_RADIUS, colorPalette.cardSurface);
  strokeRoundedRect(context, x, y, width, height, CARD_RADIUS, colorPalette.border, 1);

  // 썸네일 영역 (상단, rounded-top)
  drawThumbnailArea(context, image, colorPalette, x, y, width, THUMBNAIL_HEIGHT);

  // 썸네일 하단 경계선
  context.save();
  context.strokeStyle = colorPalette.border;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, y + THUMBNAIL_HEIGHT);
  context.lineTo(x + width, y + THUMBNAIL_HEIGHT);
  context.stroke();
  context.restore();

  // 콘텐츠 영역
  const contentY = y + THUMBNAIL_HEIGHT + CONTENT_PAD;
  const contentMaxW = width - CONTENT_PAD * 2;

  // Period (meta) — 260px 폭 기준 단축 표시
  drawText(context, {
    color: colorPalette.muted,
    font: PERIOD_FONT,
    maxWidth: contentMaxW,
    text: project.periodLabel,
    x: x + CONTENT_PAD,
    y: contentY + PERIOD_Y_OFFSET,
  });

  // Title
  drawMultilineText(context, {
    color: colorPalette.text,
    font: TITLE_FONT,
    lineHeight: TITLE_LINE_HEIGHT,
    maxLines: 2,
    maxWidth: contentMaxW,
    text: project.title,
    x: x + CONTENT_PAD,
    y: contentY + TITLE_Y_OFFSET,
  });

  // Description
  if (project.description) {
    drawMultilineText(context, {
      color: colorPalette.muted,
      font: DESCRIPTION_FONT,
      lineHeight: DESCRIPTION_LINE_HEIGHT,
      maxLines: DESCRIPTION_MAX_LINES,
      maxWidth: contentMaxW,
      text: project.description,
      x: x + CONTENT_PAD,
      y: contentY + DESCRIPTION_Y_OFFSET,
    });
  }
};

/**
 * 카드 상단 썸네일 영역을 그립니다. 이미지가 없으면 surfaceStrong 플레이스홀더를 표시합니다.
 */
const drawThumbnailArea = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  colorPalette: MonitorOverlayColorPalette,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  // clip to rounded-top rect
  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, [CARD_RADIUS, CARD_RADIUS, 0, 0]);
  context.clip();

  if (image) {
    drawCoverImage(context, image, x, y, width, height);
  } else {
    context.fillStyle = colorPalette.thumbnailBg;
    context.fillRect(x, y, width, height);
  }

  context.restore();
};

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const sw = image.naturalWidth;
  const sh = image.naturalHeight;

  if (!sw || !sh) return;

  const scale = Math.max(width / sw, height / sh);
  const dw = sw * scale;
  const dh = sh * scale;

  context.drawImage(image, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
};

type DrawTextParams = Readonly<{
  color: string;
  font: string;
  maxWidth?: number;
  text: string;
  x: number;
  y: number;
}>;

const drawText = (context: CanvasRenderingContext2D, params: DrawTextParams) => {
  context.save();
  context.fillStyle = params.color;
  context.font = params.font;
  context.fillText(truncateTextToWidth(context, params.text, params.maxWidth), params.x, params.y);
  context.restore();
};

type DrawMultilineTextParams = Readonly<{
  color: string;
  font: string;
  lineHeight: number;
  maxLines: number;
  maxWidth: number;
  text: string;
  x: number;
  y: number;
}>;

const drawMultilineText = (
  context: CanvasRenderingContext2D,
  { color, font, lineHeight, maxLines, maxWidth, text, x, y }: DrawMultilineTextParams,
) => {
  context.save();
  context.fillStyle = color;
  context.font = font;

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  lines.slice(0, maxLines).forEach((line, index, array) => {
    const displayLine =
      index === array.length - 1 && lines.length > maxLines
        ? truncateTextToWidth(context, `${line}...`, maxWidth)
        : line;

    context.fillText(displayLine, x, y + index * lineHeight);
  });

  context.restore();
};

const truncateTextToWidth = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number | undefined,
) => {
  if (!maxWidth || context.measureText(text).width <= maxWidth) return text;

  let nextText = text;

  while (nextText.length > 1 && context.measureText(`${nextText}...`).width > maxWidth) {
    nextText = nextText.slice(0, -1);
  }

  return `${nextText}...`;
};

const fillRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
) => {
  context.save();
  context.fillStyle = fillStyle;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
  context.restore();
};

const strokeRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number,
) => {
  context.save();
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.stroke();
  context.restore();
};
