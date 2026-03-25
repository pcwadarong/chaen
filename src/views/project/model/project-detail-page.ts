import { normalizeHttpUrl } from '@/shared/lib/url/normalize-http-url';

type ProjectExternalLinkItem = {
  href: string;
  key: 'github' | 'website';
  label: 'GitHub' | 'Website';
};

/**
 * 프로젝트 상세 헤더에 노출할 외부 링크 목록을 정규화합니다.
 *
 * @param params github/website 원본 URL입니다.
 * @returns http/https만 통과시킨 영문 라벨 고정 링크 목록입니다.
 */
export const resolveProjectExternalLinkItems = ({
  githubUrl,
  websiteUrl,
}: {
  githubUrl?: string | null;
  websiteUrl?: string | null;
}): ProjectExternalLinkItem[] => {
  const normalizedWebsiteUrl = normalizeHttpUrl(websiteUrl);
  const normalizedGithubUrl = normalizeHttpUrl(githubUrl);

  return [
    normalizedWebsiteUrl
      ? {
          href: normalizedWebsiteUrl,
          key: 'website' as const,
          label: 'Website' as const,
        }
      : null,
    normalizedGithubUrl
      ? {
          href: normalizedGithubUrl,
          key: 'github' as const,
          label: 'GitHub' as const,
        }
      : null,
  ].filter(item => item !== null);
};
