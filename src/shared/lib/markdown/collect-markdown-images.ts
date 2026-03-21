export type MarkdownImageViewerItem = {
  alt: string;
  src: string;
  viewerId: string;
};

const markdownImagePattern =
  /!\[(?<alt>[^\]]*)\]\((?<src>[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\)/g;

/**
 * 마크다운 문자열에서 이미지 문법만 추출해 뷰어용 목록으로 정리합니다.
 */
export const collectMarkdownImages = (markdown: string): MarkdownImageViewerItem[] => {
  const items: MarkdownImageViewerItem[] = [];
  let imageIndex = 0;

  for (const matched of markdown.matchAll(markdownImagePattern)) {
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

  return items;
};
