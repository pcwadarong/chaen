'use client';

import { useEffect, useMemo, useState } from 'react';
import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

import type { ProjectListItem } from '@/entities/project/model/types';
import {
  getMonitorOverlayScreenData,
  type MonitorOverlayScreenData,
} from '@/features/monitor-overlay/model/get-monitor-overlay-screen-data';

type UseMonitorOverlayTextureParams = Readonly<{
  items: ProjectListItem[];
  locale: string;
  ongoingLabel: string;
  title: string;
}>;

const MONITOR_TEXTURE_WIDTH = 1280;
const MONITOR_TEXTURE_HEIGHT = 800;
const MONITOR_TEXTURE_ROTATION = Math.PI / 2;

/**
 * 노트북 화면에 붙일 CanvasTexture를 생성하고, 현재 프로젝트 요약 shell을 2D canvas에 그립니다.
 * DOM rasterization 없이도 depth/backface 처리가 가능한 실제 Three texture를 만들기 위한 hook입니다.
 */
export const useMonitorOverlayTexture = ({
  items,
  locale,
  ongoingLabel,
  title,
}: UseMonitorOverlayTextureParams): Texture | null => {
  const screenData = useMemo(
    () =>
      getMonitorOverlayScreenData({
        items,
        locale,
        ongoingLabel,
        title,
      }),
    [items, locale, ongoingLabel, title],
  );
  const [primaryThumbnailImage, setPrimaryThumbnailImage] = useState<HTMLImageElement | null>(null);
  const primaryThumbnailSrc = screenData.primaryProject.thumbnailSrc;
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

  useEffect(() => {
    if (!primaryThumbnailSrc || typeof window === 'undefined') {
      setPrimaryThumbnailImage(null);
      return;
    }

    let isActive = true;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (!isActive) return;
      setPrimaryThumbnailImage(image);
    };
    image.onerror = () => {
      if (!isActive) return;
      setPrimaryThumbnailImage(null);
    };
    image.src = primaryThumbnailSrc;

    return () => {
      isActive = false;
    };
  }, [primaryThumbnailSrc]);

  useEffect(() => {
    if (!texture) return;

    const canvas = texture.image as HTMLCanvasElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    drawMonitorOverlayTexture(context, screenData, primaryThumbnailImage);
    texture.needsUpdate = true;
  }, [primaryThumbnailImage, screenData, texture]);

  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );

  return texture;
};

/**
 * monitor overlay shell을 캔버스 좌표계에 맞춰 그립니다.
 * 실제 DOM shell과 같은 정보 구조를 유지하되, 화면용 텍스처답게 대비와 여백을 더 크게 잡습니다.
 */
const drawMonitorOverlayTexture = (
  context: CanvasRenderingContext2D,
  screenData: MonitorOverlayScreenData,
  primaryThumbnailImage: HTMLImageElement | null,
) => {
  const { canvas } = context;

  context.clearRect(0, 0, canvas.width, canvas.height);

  const backgroundGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  backgroundGradient.addColorStop(0, '#0d1227');
  backgroundGradient.addColorStop(1, '#141b3c');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const shellX = 56;
  const shellY = 52;
  const shellWidth = canvas.width - shellX * 2;
  const shellHeight = canvas.height - shellY * 2;

  fillRoundedRect(context, shellX, shellY, shellWidth, shellHeight, 34, '#151d3f');
  strokeRoundedRect(
    context,
    shellX,
    shellY,
    shellWidth,
    shellHeight,
    34,
    'rgba(255,255,255,0.16)',
    4,
  );

  const headerY = shellY + 78;
  drawText(context, {
    color: 'rgba(255,255,255,0.72)',
    font: '700 28px sans-serif',
    letterSpacing: 4,
    text: screenData.overlayTitle.toUpperCase(),
    x: shellX + 44,
    y: headerY,
  });

  fillRoundedRect(
    context,
    shellX + shellWidth - 260,
    shellY + 36,
    216,
    58,
    29,
    'rgba(92,102,255,0.22)',
  );
  drawCenteredText(context, {
    color: '#f5f7ff',
    font: '700 28px sans-serif',
    text: screenData.projectCountLabel,
    x: shellX + shellWidth - 152,
    y: shellY + 73,
  });

  const heroX = shellX + 44;
  const heroY = shellY + 128;
  const heroWidth = shellWidth - 88;
  const heroHeight = 370;
  const heroPreviewWidth = 420;
  const heroInfoWidth = heroWidth - heroPreviewWidth - 26;
  const heroGradient = context.createRadialGradient(
    heroX + 80,
    heroY + 40,
    30,
    heroX + 80,
    heroY + 40,
    420,
  );
  heroGradient.addColorStop(0, 'rgba(129,140,248,0.68)');
  heroGradient.addColorStop(0.48, 'rgba(61,69,160,0.2)');
  heroGradient.addColorStop(1, 'rgba(10,14,32,0.3)');
  fillRoundedRect(context, heroX, heroY, heroWidth, heroHeight, 32, heroGradient);
  strokeRoundedRect(context, heroX, heroY, heroWidth, heroHeight, 32, 'rgba(255,255,255,0.14)', 2);

  const previewX = heroX + heroInfoWidth + 26;
  const previewY = heroY + 28;
  const previewHeight = heroHeight - 56;
  drawThumbnailPanel(context, {
    fallbackTitle: screenData.primaryProject.title,
    image: primaryThumbnailImage,
    x: previewX,
    y: previewY,
    width: heroPreviewWidth,
    height: previewHeight,
  });

  drawText(context, {
    color: 'rgba(255,255,255,0.72)',
    font: '700 24px sans-serif',
    letterSpacing: 3,
    text: screenData.primaryProject.label.toUpperCase(),
    x: heroX + 40,
    y: heroY + 64,
  });
  drawText(context, {
    color: '#ffffff',
    font: '800 72px sans-serif',
    maxWidth: heroInfoWidth - 40,
    text: screenData.primaryProject.title,
    x: heroX + 40,
    y: heroY + 172,
  });
  drawMultilineText(context, {
    color: 'rgba(255,255,255,0.82)',
    font: '500 32px sans-serif',
    lineHeight: 44,
    maxLines: 3,
    maxWidth: heroInfoWidth - 40,
    text: screenData.primaryProject.description,
    x: heroX + 40,
    y: heroY + 238,
  });
  drawText(context, {
    color: '#dbe2ff',
    font: '700 24px sans-serif',
    maxWidth: heroInfoWidth - 40,
    text: screenData.primaryProject.periodLabel,
    x: heroX + 40,
    y: heroY + heroHeight - 44,
  });
  drawChipRow(
    context,
    screenData.primaryProject.techStackNames,
    heroX + 40,
    heroY + heroHeight - 104,
    heroInfoWidth - 60,
  );

  const listY = heroY + heroHeight + 28;
  const secondaryProjects =
    screenData.secondaryProjects.length > 0
      ? screenData.secondaryProjects
      : [
          {
            periodLabel: screenData.primaryProject.periodLabel,
            techStackNames: [],
            title: 'Archive ready',
          },
        ];
  const listItemWidth =
    (heroWidth - 12 * Math.max(secondaryProjects.length - 1, 0)) /
    Math.max(secondaryProjects.length, 1);

  secondaryProjects.forEach((project, index) => {
    const itemX = heroX + index * (listItemWidth + 12);

    fillRoundedRect(context, itemX, listY, listItemWidth, 92, 28, 'rgba(255,255,255,0.08)');
    strokeRoundedRect(context, itemX, listY, listItemWidth, 92, 28, 'rgba(255,255,255,0.08)', 2);
    drawText(context, {
      color: '#aab6ff',
      font: '700 18px sans-serif',
      maxWidth: listItemWidth - 36,
      text: project.periodLabel,
      x: itemX + 18,
      y: listY + 28,
    });
    drawText(context, {
      color: '#ffffff',
      font: '600 26px sans-serif',
      maxWidth: listItemWidth - 36,
      text: project.title,
      x: itemX + 18,
      y: listY + 58,
    });
    drawText(context, {
      color: 'rgba(255,255,255,0.68)',
      font: '500 17px sans-serif',
      maxWidth: listItemWidth - 36,
      text: project.techStackNames.join(' · '),
      x: itemX + 18,
      y: listY + 80,
    });
  });
};

type DrawThumbnailPanelParams = Readonly<{
  fallbackTitle: string;
  height: number;
  image: HTMLImageElement | null;
  width: number;
  x: number;
  y: number;
}>;

/**
 * 대표 프로젝트 썸네일을 hero 패널 우측에 그립니다.
 * 이미지가 없거나 로드에 실패하면 제목 이니셜 기반 플레이스홀더를 대신 노출합니다.
 */
const drawThumbnailPanel = (
  context: CanvasRenderingContext2D,
  { fallbackTitle, height, image, width, x, y }: DrawThumbnailPanelParams,
) => {
  fillRoundedRect(context, x, y, width, height, 26, 'rgba(8, 11, 22, 0.48)');

  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, 26);
  context.clip();

  if (image) {
    drawCoverImage(context, image, x, y, width, height);
    context.restore();
    strokeRoundedRect(context, x, y, width, height, 26, 'rgba(255,255,255,0.14)', 2);
    return;
  }

  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, '#1f2b62');
  gradient.addColorStop(1, '#0d1227');
  context.fillStyle = gradient;
  context.fillRect(x, y, width, height);
  context.restore();

  drawCenteredText(context, {
    color: 'rgba(255,255,255,0.86)',
    font: '800 72px sans-serif',
    text: getTitleInitials(fallbackTitle),
    x: x + width / 2,
    y: y + height / 2 + 24,
  });
  strokeRoundedRect(context, x, y, width, height, 26, 'rgba(255,255,255,0.14)', 2);
};

/**
 * 노트북 화면용 썸네일을 cover 방식으로 잘라 그립니다.
 */
const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  if (!sourceWidth || !sourceHeight) return;

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
};

/**
 * 대표 프로젝트의 기술 스택을 pill 형태로 나열합니다.
 */
const drawChipRow = (
  context: CanvasRenderingContext2D,
  chipLabels: string[],
  startX: number,
  baselineY: number,
  maxWidth: number,
) => {
  if (chipLabels.length === 0) return;

  context.save();
  context.font = '600 20px sans-serif';
  let currentX = startX;

  for (const chipLabel of chipLabels) {
    const chipWidth = context.measureText(chipLabel).width + 26;

    if (currentX + chipWidth - startX > maxWidth) {
      break;
    }

    fillRoundedRect(context, currentX, baselineY - 22, chipWidth, 32, 16, 'rgba(255,255,255,0.1)');
    drawText(context, {
      color: '#eef2ff',
      font: '600 20px sans-serif',
      text: chipLabel,
      x: currentX + 13,
      y: baselineY,
    });
    currentX += chipWidth + 10;
  }

  context.restore();
};

/**
 * 프로젝트 제목에서 플레이스홀더용 이니셜을 생성합니다.
 */
const getTitleInitials = (title: string) =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('') || 'P';

type DrawTextParams = Readonly<{
  color: string;
  font: string;
  letterSpacing?: number;
  maxWidth?: number;
  text: string;
  x: number;
  y: number;
}>;

/**
 * 단일 행 텍스트를 캔버스에 그립니다.
 */
const drawText = (context: CanvasRenderingContext2D, params: DrawTextParams) => {
  context.save();
  context.fillStyle = params.color;
  context.font = params.font;

  if (params.letterSpacing) {
    const text = truncateTextToWidth(context, params.text, params.maxWidth);
    let currentX = params.x;

    for (const character of text) {
      context.fillText(character, currentX, params.y);
      currentX += context.measureText(character).width + params.letterSpacing;
    }

    context.restore();
    return;
  }

  context.fillText(truncateTextToWidth(context, params.text, params.maxWidth), params.x, params.y);
  context.restore();
};

type DrawCenteredTextParams = Readonly<{
  color: string;
  font: string;
  text: string;
  x: number;
  y: number;
}>;

/**
 * 중앙 정렬된 짧은 문구를 그립니다.
 */
const drawCenteredText = (context: CanvasRenderingContext2D, params: DrawCenteredTextParams) => {
  context.save();
  context.fillStyle = params.color;
  context.font = params.font;
  context.textAlign = 'center';
  context.fillText(params.text, params.x, params.y);
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

/**
 * 지정한 폭 안에서 여러 줄 설명 문구를 그립니다.
 */
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
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.slice(0, maxLines).forEach((line, index, array) => {
    const displayLine =
      index === array.length - 1 && lines.length > maxLines
        ? truncateTextToWidth(context, `${line}...`, maxWidth)
        : line;

    context.fillText(displayLine, x, y + index * lineHeight);
  });

  context.restore();
};

/**
 * 주어진 최대 폭 안에 들어오도록 문구를 줄입니다.
 */
const truncateTextToWidth = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number | undefined,
) => {
  if (!maxWidth || context.measureText(text).width <= maxWidth) {
    return text;
  }

  let nextText = text;

  while (nextText.length > 1 && context.measureText(`${nextText}...`).width > maxWidth) {
    nextText = nextText.slice(0, -1);
  }

  return `${nextText}...`;
};

/**
 * 둥근 사각형 배경을 채웁니다.
 */
const fillRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
) => {
  context.save();
  context.fillStyle = fillStyle;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
  context.restore();
};

/**
 * 둥근 사각형 외곽선을 그립니다.
 */
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
