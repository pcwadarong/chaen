import { resolveAttachmentDownloadHref } from '@/shared/lib/storage/attachment-download-path';

/**
 * 현재 앱의 attachment 다운로드 링크 해석 규칙을 markdown renderer에 연결합니다.
 * package 기본 renderer는 원본 href를 그대로 사용할 수 있고, 현재 앱에서는 이 resolver를 기본 adapter로 사용합니다.
 */
export const resolveMarkdownAttachmentHref = resolveAttachmentDownloadHref;
