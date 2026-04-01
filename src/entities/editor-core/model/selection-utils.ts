/**
 * editor-core facade: textarea selection 변환 유틸의 안정적인 package 경계입니다.
 * 현재 구현은 기존 editor entity를 재사용하지만, 이후 외부 package 추출 시
 * 소비처 import를 유지한 채 내부 구현만 독립시킬 수 있도록 이 경로를 우선 사용합니다.
 */
export * from '@/entities/editor/model/selection-utils';
