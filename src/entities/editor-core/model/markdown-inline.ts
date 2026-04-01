/**
 * editor-core facade: markdown inline 정규화/전처리 계약의 안정적인 package 경계입니다.
 * 현재 리포에서는 기존 rich-markdown 구현을 재사용하고, 이후 외부 추출 단계에서
 * 실제 구현을 이 경계 뒤로 이동시키는 것을 목표로 합니다.
 */
export * from '@/shared/lib/markdown/rich-markdown-inline';
