/**
 * editor-core facade: markdown template 생성 규칙의 안정적인 package 경계입니다.
 * 현재는 기존 editor feature 구현을 재노출하며, 이후 package 추출 시 이 경계를 기준으로
 * 실제 로직을 옮길 수 있도록 import surface를 고정합니다.
 */
export * from '@/features/edit-markdown/model/markdown-toolbar-templates';
