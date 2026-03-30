export type AdminConsoleSection = 'content' | 'dashboard' | 'drafts' | 'photo' | 'resume';

type AdminConsoleNavigationItem = {
  href: string;
  label: string;
  section: AdminConsoleSection;
};

/**
 * 관리자 콘솔에서 공통으로 사용하는 섹션 네비게이션 정의입니다.
 */
export const adminConsoleNavigationItems: AdminConsoleNavigationItem[] = [
  { href: '/admin', label: 'Dashboard', section: 'dashboard' },
  { href: '/admin/content', label: 'Content', section: 'content' },
  { href: '/admin/photo', label: 'Photo', section: 'photo' },
  { href: '/admin/resume/edit', label: 'Resume', section: 'resume' },
  { href: '/admin/drafts', label: 'Drafts', section: 'drafts' },
];
