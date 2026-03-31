export type MarkdownImageViewerItem = {
  alt: string;
  src: string;
  viewerId: string;
};

const markdownImagePattern =
  /!\[(?<alt>[^\]]*)\]\((?<src>[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\)/g;
const galleryStartPattern = /^:::gallery\s*$/;
const galleryEndPattern = /^:::\s*$/;

/**
 * 마크다운 문자열에서 이미지 문법만 추출해 뷰어용 목록으로 정리합니다.
 */
export const collectMarkdownImages = (markdown: string): MarkdownImageViewerItem[] => {
  const items: MarkdownImageViewerItem[] = [];
  let imageIndex = 0;
  let isInsideGallery = false;

  for (const line of markdown.split('\n')) {
    if (galleryStartPattern.test(line)) {
      isInsideGallery = true;
      continue;
    }

    if (isInsideGallery && galleryEndPattern.test(line)) {
      isInsideGallery = false;
      continue;
    }

    if (isInsideGallery) continue;

    for (const matched of line.matchAll(markdownImagePattern)) {
      const alt = matched.groups?.alt?.trim() ?? '';
      const src = matched.groups?.src?.trim() ?? '';

      if (!src) continue;

      items.push({
        alt,
        src,
        viewerId: `markdown-image-${imageIndex}`,
      });
      imageIndex += 1;
    }
  }

  return items;
};
